/**
 * AI Auto-Trade Engine — Phase 4 (live + dry-run executor)
 *
 * Pipeline per tick (default every 5 min):
 *   1. Load every enabled, non-killed AutoTradeConfig.
 *   2. For each user: trip kill switch if today's realized P/L ≤ -dailyLossLimit.
 *   3. For each allowed symbol: fetch spot, /predict, /rationale, decide.
 *   4. If mode='dry-run' OR live gates fail → write ledger as 'dry-run'/'skipped'.
 *   5. If mode='live' AND every gate passes → decrypt user keys IN MEMORY,
 *      market-buy with maxPositionUsd notional, bracket with an OCO sell.
 *      Lifecycle: 'submitted' → 'filled' (engine never holds keys across awaits).
 *
 * Safety gates required for live execution at EVERY tick:
 *   ✓ process.env.ALLOW_LIVE_TRADING === 'true'
 *   ✓ cfg.mode === 'live'
 *   ✓ liveAcknowledgedAt within LIVE_ACK_TTL_HOURS
 *   ✓ UserApiKeys row exists, lastTestStatus === 'ok'
 *   ✓ daily-loss limit not breached
 *   ✓ usable USDT balance ≥ requested notional
 *   ✓ consecutiveFailures < LIVE_FAILURE_THRESHOLD
 */
const axios = require("axios");
const { Op } = require("sequelize");
const AutoTradeConfig = require("../Models/Trading/AutoTradeConfig");
const TradeLedger = require("../Models/Trading/TradeLedger");
const UserApiKeys = require("../Models/User/UserApiKeys");
const { decrypt } = require("../Utils/crypto");
const binance = require("./binanceExchange");
const metrics = require("./metrics");
const webhook = require("./webhookDispatcher");
const { withBreaker, CircuitOpenError } = require("./circuitBreaker");

const CONFIDENCE_RANK = { low: 1, medium: 2, high: 3 };

const POLL_INTERVAL_MS = Number(process.env.AUTO_TRADE_TICK_MS || 5 * 60 * 1000);
const PREDICTION_API_URL =
  process.env.PREDICTION_API_URL || "http://localhost:5000";

const predClient = axios.create({
  baseURL: PREDICTION_API_URL,
  timeout: 20000,
});

const binanceMarket = axios.create({
  baseURL: "https://api.binance.com/api/v3",
  timeout: 8000,
});

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const log = (level, msg, meta = {}) => {
  // One-line JSON log — easy to grep and easy to feed into any aggregator.
  const line = { ts: new Date().toISOString(), level, svc: "auto-trade", msg, ...meta };
  console.log(JSON.stringify(line));
};

let intervalId = null;
let ticking = false;
let lastTickAt = null;

function liveAckValid(cfg) {
  if (!cfg.liveAcknowledgedAt) return false;
  const ttlMs = AutoTradeConfig.HARD_LIMITS.LIVE_ACK_TTL_HOURS * 60 * 60 * 1000;
  return Date.now() - new Date(cfg.liveAcknowledgedAt).getTime() < ttlMs;
}

async function bumpFailure(cfg, reason) {
  const next = (cfg.consecutiveFailures || 0) + 1;
  const patch = { consecutiveFailures: next };
  if (next >= AutoTradeConfig.HARD_LIMITS.LIVE_FAILURE_THRESHOLD) {
    patch.enabled = false;
    patch.killSwitchTriggered = true;
    patch.killSwitchAt = new Date();
    patch.killSwitchReason = `Auto kill: ${next} consecutive failures (${reason.slice(0, 80)})`;
    log("warn", "consecutive_failure_kill_switch", { userId: cfg.userId, reason });
    metrics.killSwitches.inc({ reason_bucket: "consecutive_failures" });
    webhook.dispatch(cfg, "kill_switch_engaged", {
      reason: patch.killSwitchReason,
      trigger: "consecutive_failures",
      failures: next,
    });
  }
  await cfg.update(patch);
}

async function resetFailures(cfg) {
  if (cfg.consecutiveFailures) await cfg.update({ consecutiveFailures: 0 });
}

async function logSkip(ctx, reason, extras = {}) {
  metrics.tradeSkips.inc({
    symbol: ctx.symbol,
    reason_bucket: metrics.bucketReason(reason),
  });
  await TradeLedger.create({
    userId: ctx.userId,
    symbol: ctx.symbol,
    side: "buy",
    status: "skipped",
    mode: ctx.mode,
    reason: reason.slice(0, 400),
    notionalUsd: 0,
    qty: 0,
    entryPrice: extras.spot || 0,
    predictedClose: extras.pred?.close,
    predictedMovePct: extras.predictedMovePct,
    confidence: extras.rationale?.confidence_label,
  });
}

async function evaluateSymbol(cfg, symbol) {
  const ctx = { userId: cfg.userId, symbol, mode: cfg.mode };
  try {
    // 1. Spot price
    const spotRes = await binanceMarket.get(`/ticker/price`, {
      params: { symbol: `${symbol}USDT` },
    });
    const spot = Number(spotRes.data.price);
    if (!Number.isFinite(spot) || spot <= 0) {
      return logSkip(ctx, `invalid spot price for ${symbol}USDT`);
    }

    // 2. Prediction
    const predRes = await predClient.get(`/predict`, { params: { symbol } });
    const pred = predRes.data.prediction;
    const predictedMovePct = ((pred.close - spot) / spot) * 100;

    // 3. Rationale
    const ratRes = await predClient.post(`/rationale`, {
      symbol,
      current_price: spot,
      predicted: pred,
    });
    const rationale = ratRes.data;

    // 4. Confidence floor
    const confidenceOk =
      CONFIDENCE_RANK[rationale.confidence_label] >=
      CONFIDENCE_RANK[cfg.minConfidence];
    if (!confidenceOk) {
      return logSkip(
        ctx,
        `confidence ${rationale.confidence_label} below floor ${cfg.minConfidence}`,
        { pred, predictedMovePct, rationale, spot }
      );
    }

    // 5. Direction + stop-band signal threshold
    const stopBandPct = Number(cfg.stopLossPct);
    let side = null;
    if (predictedMovePct > stopBandPct) side = "buy";
    else if (predictedMovePct < -stopBandPct) side = "sell";
    if (!side) {
      return logSkip(
        ctx,
        `|move| ${predictedMovePct.toFixed(2)}% within stop-band ±${stopBandPct}%`,
        { pred, predictedMovePct, rationale, spot }
      );
    }

    const notional = Number(cfg.maxPositionUsd);
    const slPrice =
      side === "buy" ? spot * (1 - stopBandPct / 100) : spot * (1 + stopBandPct / 100);
    const tpPrice =
      side === "buy"
        ? spot * (1 + Number(cfg.takeProfitPct) / 100)
        : spot * (1 - Number(cfg.takeProfitPct) / 100);

    const baseRow = {
      userId: cfg.userId,
      symbol,
      side,
      mode: cfg.mode,
      notionalUsd: notional,
      qty: notional / spot,
      entryPrice: spot,
      stopLossPrice: slPrice,
      takeProfitPrice: tpPrice,
      predictedClose: pred.close,
      predictedMovePct,
      confidence: rationale.confidence_label,
    };

    // 6. Mode branch
    if (cfg.mode !== "live") {
      await TradeLedger.create({
        ...baseRow,
        status: "dry-run",
        reason: `auto: ${rationale.confidence_label} confidence, move ${predictedMovePct.toFixed(2)}%`,
      });
      metrics.tradeDecisions.inc({
        mode: cfg.mode,
        status: "dry-run",
        side,
        symbol,
      });
      log("info", "decision_dry_run", { userId: cfg.userId, symbol, side });
      await resetFailures(cfg);
      return;
    }

    // ---------- LIVE PATH ----------

    // Server-side live gates re-checked here even though /config enforces them,
    // in case env or DB state shifted since the config was last updated.
    if (process.env.ALLOW_LIVE_TRADING !== "true") {
      return logSkip(ctx, "live: ALLOW_LIVE_TRADING=false on server");
    }
    if (!liveAckValid(cfg)) {
      // Soft-degrade: don't kill, just refuse this tick and notify the user
      // (the controller blocks future updates until re-ack).
      await cfg.update({ mode: "dry-run", liveAcknowledgedAt: null });
      return logSkip(
        ctx,
        "live ack expired — auto-reverted to dry-run, please re-acknowledge"
      );
    }

    const keys = await UserApiKeys.findOne({
      where: { userId: cfg.userId, exchange: "binance" },
    });
    if (!keys || keys.lastTestStatus !== "ok") {
      return logSkip(ctx, "live: no tested Binance keys on file");
    }

    // Decrypt in this scope only; no leak past the await chain.
    let apiKey, apiSecret;
    try {
      apiKey = decrypt(keys.apiKeyEnc);
      apiSecret = decrypt(keys.apiSecretEnc);
    } catch (e) {
      await bumpFailure(cfg, "decrypt_failed");
      return logSkip(ctx, `live: decrypt failed (${e.message})`);
    }

    const cbKey = (endpoint) => `${cfg.userId}:${endpoint}`;

    if (side === "buy") {
      return doLiveBuy({
        cfg,
        ctx,
        symbol,
        spot,
        notional,
        stopBandPct,
        baseRow,
        apiKey,
        apiSecret,
        cbKey,
      });
    }

    // side === 'sell' → close any open long inventory on this symbol.
    return doLiveSell({
      cfg,
      ctx,
      symbol,
      spot,
      notional,
      baseRow,
      apiKey,
      apiSecret,
      cbKey,
    });
  } catch (err) {
    const message = err.response?.data?.detail || err.message;
    metrics.engineErrors.inc({ stage: "evaluate_symbol" });
    log("error", "evaluate_symbol_failed", {
      userId: cfg.userId,
      symbol,
      msg: message,
    });
    await bumpFailure(cfg, message).catch(() => {});
    await TradeLedger.create({
      userId: cfg.userId,
      symbol,
      side: "buy",
      status: "failed",
      mode: cfg.mode,
      reason: `engine error: ${message}`.slice(0, 400),
      notionalUsd: 0,
      qty: 0,
      entryPrice: 0,
    }).catch(() => {});
  }
}

/**
 * Wrapper that runs a Binance call inside the per-(user, endpoint) circuit
 * breaker. Converts `CircuitOpenError` into a `transient` failure so the
 * caller can surface it consistently.
 */
async function via(cbKey, endpoint, fn) {
  return withBreaker(cbKey(endpoint), () => fn());
}

async function doLiveBuy({
  cfg, ctx, symbol, spot, notional, stopBandPct, baseRow,
  apiKey, apiSecret, cbKey,
}) {
  // Balance precheck
  let usdtFree = 0;
  try {
    usdtFree = await via(cbKey, "getAccount", () =>
      binance.getUsdtBalance({ apiKey, apiSecret })
    );
  } catch (e) {
    await bumpFailure(cfg, `getUsdtBalance: ${e.msg || e.message}`);
    return logSkip(ctx, `live: balance check failed (${e.msg || e.message})`);
  }
  const usable = Math.max(0, usdtFree - 5);
  if (usable < AutoTradeConfig.HARD_LIMITS.MIN_ORDER_NOTIONAL_USD) {
    return logSkip(ctx, `live: USDT balance $${usdtFree.toFixed(2)} below minimum`);
  }
  const useNotional = Math.min(notional, usable);

  let order;
  try {
    order = await via(cbKey, "marketBuy", () =>
      binance.marketBuy({
        apiKey, apiSecret, symbol,
        quoteOrderQty: useNotional,
        userId: cfg.userId,
      })
    );
  } catch (e) {
    await bumpFailure(cfg, `marketBuy: ${e.msg || e.message}`);
    await TradeLedger.create({
      ...baseRow,
      status: "failed",
      reason: `live marketBuy failed: ${e.msg || e.message}`.slice(0, 400),
    });
    metrics.liveOrders.inc({ symbol, side: "buy", status: "failed" });
    metrics.engineErrors.inc({ stage: "marketBuy" });
    return;
  }

  const filledQty = Number(order.executedQty);
  const filledQuote = Number(order.cummulativeQuoteQty);
  const avgPrice = filledQty > 0 ? filledQuote / filledQty : spot;
  const finalStatus = order.status === "FILLED" ? "filled" : "submitted";

  const ledger = await TradeLedger.create({
    ...baseRow,
    qty: filledQty,
    notionalUsd: filledQuote,
    entryPrice: avgPrice,
    status: finalStatus,
    exchangeOrderId: String(order.orderId),
    clientOrderId: order.clientOrderId || null,
    reason: `live MARKET BUY ${symbol} @ avg $${avgPrice.toFixed(2)}`,
  });
  metrics.tradeDecisions.inc({ mode: "live", status: finalStatus, side: "buy", symbol });
  metrics.liveOrders.inc({ symbol, side: "buy", status: finalStatus });
  log("info", "live_buy_filled", {
    userId: cfg.userId, symbol, orderId: order.orderId, avgPrice, qty: filledQty,
  });
  webhook.dispatch(cfg, "live_order_filled", {
    symbol, side: "buy", orderId: String(order.orderId),
    avgPrice: Number(avgPrice.toFixed(8)),
    qty: Number(filledQty),
    notionalUsd: Number(filledQuote.toFixed(2)),
  });

  // Bracket with an OCO sell
  try {
    const recomputedSL = avgPrice * (1 - stopBandPct / 100);
    const recomputedTP = avgPrice * (1 + Number(cfg.takeProfitPct) / 100);
    const oco = await via(cbKey, "placeOcoSell", () =>
      binance.placeOcoSell({
        apiKey, apiSecret, symbol,
        quantity: filledQty,
        takeProfitPrice: recomputedTP,
        stopLossPrice: recomputedSL,
        userId: cfg.userId,
      })
    );
    log("info", "live_oco_placed", {
      userId: cfg.userId, symbol, listClientOrderId: oco.listClientOrderId,
    });
  } catch (e) {
    log("error", "live_oco_failed", {
      userId: cfg.userId, symbol, msg: e.msg || e.message,
    });
    await ledger.update({
      reason: `${ledger.reason} | OCO FAILED: ${(e.msg || e.message).slice(0, 200)}`,
    });
  }

  await resetFailures(cfg);
}

async function doLiveSell({
  cfg, ctx, symbol, spot, notional, baseRow, apiKey, apiSecret, cbKey,
}) {
  // 1. Cancel any existing open orders for this symbol so they don't fight us.
  try {
    await via(cbKey, "cancelAllOpenOrders", () =>
      binance.cancelAllOpenOrders({ apiKey, apiSecret, symbol })
    );
  } catch (e) {
    await bumpFailure(cfg, `cancelAllOpenOrders: ${e.msg || e.message}`);
    return logSkip(ctx, `live: cancel-open-orders failed (${e.msg || e.message})`);
  }

  // 2. Find out how much we hold.
  let baseFree = 0;
  try {
    baseFree = await via(cbKey, "getAccount", () =>
      binance.getBaseBalance({ apiKey, apiSecret, asset: symbol })
    );
  } catch (e) {
    await bumpFailure(cfg, `getBaseBalance: ${e.msg || e.message}`);
    return logSkip(ctx, `live: base balance check failed (${e.msg || e.message})`);
  }

  if (baseFree <= 0) {
    return logSkip(ctx, "live: no open inventory to sell on SELL signal", { spot });
  }

  // 3. Cap exit notional at maxPositionUsd so we don't dump a huge manual holding.
  const exitQty = Math.min(baseFree, notional / spot);
  const exitNotionalEstimate = exitQty * spot;
  if (exitNotionalEstimate < AutoTradeConfig.HARD_LIMITS.MIN_ORDER_NOTIONAL_USD) {
    return logSkip(
      ctx,
      `live: SELL skipped — position $${exitNotionalEstimate.toFixed(2)} below minimum`,
      { spot }
    );
  }

  // 4. Market-sell.
  let order;
  try {
    order = await via(cbKey, "marketSell", () =>
      binance.marketSell({
        apiKey, apiSecret, symbol,
        quantity: exitQty,
        userId: cfg.userId,
      })
    );
  } catch (e) {
    await bumpFailure(cfg, `marketSell: ${e.msg || e.message}`);
    await TradeLedger.create({
      ...baseRow,
      status: "failed",
      reason: `live marketSell failed: ${e.msg || e.message}`.slice(0, 400),
    });
    metrics.liveOrders.inc({ symbol, side: "sell", status: "failed" });
    metrics.engineErrors.inc({ stage: "marketSell" });
    return;
  }

  const filledQty = Number(order.executedQty);
  const filledQuote = Number(order.cummulativeQuoteQty);
  const avgPrice = filledQty > 0 ? filledQuote / filledQty : spot;
  const finalStatus = order.status === "FILLED" ? "filled" : "submitted";

  // 5. Best-effort realized P/L using the most recent filled BUY for this user+symbol.
  let realizedPnlUsd = null;
  try {
    const lastBuy = await TradeLedger.findOne({
      where: { userId: cfg.userId, symbol, side: "buy", status: ["filled", "submitted"] },
      order: [["createdAt", "DESC"]],
    });
    if (lastBuy) {
      const entry = Number(lastBuy.entryPrice);
      if (entry > 0) realizedPnlUsd = (avgPrice - entry) * filledQty;
    }
  } catch (e) {
    // Non-fatal — leave realizedPnlUsd null
    log("warn", "pnl_lookup_failed", { msg: e.message });
  }

  await TradeLedger.create({
    ...baseRow,
    side: "sell",
    qty: filledQty,
    notionalUsd: filledQuote,
    entryPrice: avgPrice, // exit price recorded as entry on the sell row
    status: finalStatus,
    exchangeOrderId: String(order.orderId),
    clientOrderId: order.clientOrderId || null,
    realizedPnlUsd,
    reason: `live MARKET SELL ${symbol} @ avg $${avgPrice.toFixed(2)} (close)`,
  });
  metrics.tradeDecisions.inc({ mode: "live", status: finalStatus, side: "sell", symbol });
  metrics.liveOrders.inc({ symbol, side: "sell", status: finalStatus });
  log("info", "live_sell_filled", {
    userId: cfg.userId, symbol, orderId: order.orderId, avgPrice, qty: filledQty,
    realizedPnlUsd,
  });
  webhook.dispatch(cfg, "live_order_filled", {
    symbol, side: "sell", orderId: String(order.orderId),
    avgPrice: Number(avgPrice.toFixed(8)),
    qty: Number(filledQty),
    notionalUsd: Number(filledQuote.toFixed(2)),
    realizedPnlUsd: realizedPnlUsd != null ? Number(realizedPnlUsd.toFixed(2)) : null,
  });

  await resetFailures(cfg);
}

async function evaluateUser(cfg) {
  // Daily-loss auto-trip
  const todayRows = await TradeLedger.findAll({
    where: {
      userId: cfg.userId,
      createdAt: { [Op.gte]: startOfToday() },
    },
    attributes: ["realizedPnlUsd"],
  });
  const pnlToday = todayRows.reduce(
    (sum, r) => sum + Number(r.realizedPnlUsd || 0),
    0
  );
  if (pnlToday <= -Number(cfg.dailyLossLimitUsd)) {
    const reason = `Daily loss limit hit (P/L $${pnlToday.toFixed(2)})`;
    await cfg.update({
      enabled: false,
      killSwitchTriggered: true,
      killSwitchAt: new Date(),
      killSwitchReason: reason,
    });
    log("warn", "daily_loss_kill_switch", { userId: cfg.userId, pnlToday });
    metrics.killSwitches.inc({ reason_bucket: "daily_loss" });
    webhook.dispatch(cfg, "daily_loss_limit_hit", {
      reason,
      pnlTodayUsd: Number(pnlToday.toFixed(2)),
      limitUsd: Number(cfg.dailyLossLimitUsd),
    });
    return;
  }

  const symbols = Array.isArray(cfg.allowedSymbols)
    ? cfg.allowedSymbols
    : JSON.parse(cfg.allowedSymbols || "[]");
  for (const symbol of symbols) {
    await evaluateSymbol(cfg, symbol);
  }
}

async function tick() {
  if (ticking) {
    log("debug", "tick_skipped_overlap");
    return;
  }
  ticking = true;
  lastTickAt = new Date();
  const stopTimer = metrics.tickDuration.startTimer();
  try {
    const configs = await AutoTradeConfig.findAll({
      where: { enabled: true, killSwitchTriggered: false },
    });
    if (configs.length === 0) return;
    log("info", "tick_start", { configs: configs.length });
    for (const cfg of configs) {
      try {
        await evaluateUser(cfg);
      } catch (err) {
        metrics.engineErrors.inc({ stage: "user_tick" });
        log("error", "user_tick_failed", { userId: cfg.userId, msg: err.message });
      }
    }
  } catch (err) {
    metrics.engineErrors.inc({ stage: "tick" });
    log("error", "tick_failed", { msg: err.message });
  } finally {
    ticking = false;
    stopTimer();
  }
}

exports.start = function start() {
  if (intervalId) return;
  if (process.env.AUTO_TRADE_ENABLED === "false") {
    log("info", "engine_disabled_via_env");
    return;
  }
  const liveAllowed = process.env.ALLOW_LIVE_TRADING === "true";
  log("info", "engine_started", {
    tickMs: POLL_INTERVAL_MS,
    predictionApi: PREDICTION_API_URL,
    liveAllowed,
  });
  intervalId = setInterval(tick, POLL_INTERVAL_MS);
  setTimeout(tick, 5_000); // warm-up tick after db.sync settles
};

exports.stop = function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    log("info", "engine_stopped");
  }
};

exports.runOnceForTest = tick;
exports.lastTickAt = () => lastTickAt;
