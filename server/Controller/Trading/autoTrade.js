const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const AutoTradeConfig = require("../../Models/Trading/AutoTradeConfig");
const TradeLedger = require("../../Models/Trading/TradeLedger");
const UserApiKeys = require("../../Models/User/UserApiKeys");
const User = require("../../Models/User/users");
const WebhookDelivery = require("../../Models/Trading/WebhookDelivery");
const binance = require("../../Services/binanceExchange");
const webhookDispatcher = require("../../Services/webhookDispatcher");
const { decrypt } = require("../../Utils/crypto");

// Phase 12: opinionated one-click profiles. Server-owned so the limits stay
// within HARD_LIMITS even if a client tampers with the request.
const STRATEGY_PRESETS = Object.freeze([
  {
    id: "conservative",
    name: "Conservative",
    description: "Tight stops, small positions, high-confidence-only signals.",
    config: {
      maxPositionUsd: 100,
      dailyLossLimitUsd: 25,
      stopLossPct: 1.5,
      takeProfitPct: 3,
      minConfidence: "high",
      allowedSymbols: ["BTC", "ETH"],
    },
  },
  {
    id: "moderate",
    name: "Moderate",
    description: "Balanced risk and reward. Most users start here.",
    config: {
      maxPositionUsd: 500,
      dailyLossLimitUsd: 100,
      stopLossPct: 2,
      takeProfitPct: 4,
      minConfidence: "medium",
      allowedSymbols: ["BTC", "ETH", "SOL", "BNB"],
    },
  },
  {
    id: "aggressive",
    name: "Aggressive",
    description: "Larger positions, looser stops, takes lower-confidence signals.",
    config: {
      maxPositionUsd: 2000,
      dailyLossLimitUsd: 500,
      stopLossPct: 3,
      takeProfitPct: 6,
      minConfidence: "low",
      allowedSymbols: ["BTC", "ETH", "SOL", "BNB", "ATOM"],
    },
  },
]);

const PUBLIC_FIELDS = [
  "enabled",
  "mode",
  "maxPositionUsd",
  "dailyLossLimitUsd",
  "stopLossPct",
  "takeProfitPct",
  "minConfidence",
  "allowedSymbols",
  "killSwitchTriggered",
  "killSwitchAt",
  "killSwitchReason",
  "liveAcknowledgedAt",
  "consecutiveFailures",
  "webhookUrl",
  "webhookEvents",
  "updatedAt",
];

const isLiveAckValid = (cfg) => {
  if (!cfg.liveAcknowledgedAt) return false;
  const ttlMs = AutoTradeConfig.HARD_LIMITS.LIVE_ACK_TTL_HOURS * 60 * 60 * 1000;
  return Date.now() - new Date(cfg.liveAcknowledgedAt).getTime() < ttlMs;
};

const serialize = (cfg) => {
  if (!cfg) return null;
  const json = cfg.toJSON ? cfg.toJSON() : cfg;
  return {
    ...PUBLIC_FIELDS.reduce((acc, k) => {
      acc[k] = json[k];
      return acc;
    }, {}),
    maxPositionUsd: Number(json.maxPositionUsd),
    dailyLossLimitUsd: Number(json.dailyLossLimitUsd),
    stopLossPct: Number(json.stopLossPct),
    takeProfitPct: Number(json.takeProfitPct),
    hardLimits: AutoTradeConfig.HARD_LIMITS,
    liveAckValid: isLiveAckValid(json),
    liveAllowedByServer: process.env.ALLOW_LIVE_TRADING === "true",
    // Never return the raw secret on a normal read; only the mask.
    webhookSecretMask: json.webhookSecret
      ? webhookDispatcher.maskSecret(json.webhookSecret)
      : null,
    webhookSigned: Boolean(json.webhookSecret),
  };
};

const findOrCreateConfig = async (userId) => {
  const [cfg] = await AutoTradeConfig.findOrCreate({
    where: { userId },
    defaults: { userId },
  });
  return cfg;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

exports.getConfig = async (req, res) => {
  try {
    const cfg = await findOrCreateConfig(req.user.id);
    return res.json({ success: true, data: serialize(cfg) });
  } catch (err) {
    console.error("getConfig failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load config", error: err.message });
  }
};

exports.updateConfig = async (req, res) => {
  const allowed = [
    "enabled",
    "mode",
    "maxPositionUsd",
    "dailyLossLimitUsd",
    "stopLossPct",
    "takeProfitPct",
    "minConfidence",
    "allowedSymbols",
    "webhookUrl",
    "webhookEvents",
  ];

  const patch = {};
  for (const key of allowed) {
    if (key in req.body) patch[key] = req.body[key];
  }

  try {
    const cfg = await findOrCreateConfig(req.user.id);

    // Live-mode gate: 4 independent conditions, all required.
    if (patch.mode === "live") {
      if (process.env.ALLOW_LIVE_TRADING !== "true") {
        return res.status(403).json({
          success: false,
          code: "LIVE_DISABLED_BY_SERVER",
          message:
            "Live trading is disabled on this server. Ask an operator to set ALLOW_LIVE_TRADING=true.",
        });
      }
      if (!isLiveAckValid(cfg)) {
        return res.status(403).json({
          success: false,
          code: "LIVE_ACK_REQUIRED",
          message:
            "Re-acknowledge live trading by re-entering your password. ACK expires every " +
            `${AutoTradeConfig.HARD_LIMITS.LIVE_ACK_TTL_HOURS}h.`,
        });
      }
      const keys = await UserApiKeys.findOne({
        where: { userId: req.user.id, exchange: "binance" },
      });
      if (!keys) {
        return res.status(412).json({
          success: false,
          code: "API_KEYS_MISSING",
          message: "Add Binance API keys before enabling live trading.",
        });
      }
      if (keys.lastTestStatus !== "ok") {
        return res.status(412).json({
          success: false,
          code: "API_KEYS_UNTESTED",
          message:
            "Your Binance API keys have not passed the test step. Open /settings/api-keys and test them first.",
        });
      }
    }

    // Block flipping enabled=true while kill switch is engaged.
    if (cfg.killSwitchTriggered && patch.enabled === true) {
      return res.status(409).json({
        success: false,
        code: "KILL_SWITCH_ENGAGED",
        message: "Kill switch is engaged. Reset it before re-enabling auto-trade.",
      });
    }

    // Flipping away from live invalidates the ack (cheap defence in depth).
    if (patch.mode && patch.mode !== "live") patch.liveAcknowledgedAt = null;

    // Auto-generate the webhook HMAC secret the first time a URL is saved.
    let revealedSecret = null;
    if (
      patch.webhookUrl &&
      patch.webhookUrl !== "" &&
      !cfg.webhookSecret
    ) {
      revealedSecret = webhookDispatcher.generateSecret();
      patch.webhookSecret = revealedSecret;
    }
    // Clearing the URL also clears the secret + event filter.
    if (patch.webhookUrl === "" || patch.webhookUrl === null) {
      patch.webhookSecret = null;
      patch.webhookEvents = null;
    }

    await cfg.update(patch);
    const data = serialize(cfg);
    if (revealedSecret) data.webhookSecret = revealedSecret;
    return res.json({ success: true, data });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid config",
        errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
      });
    }
    console.error("updateConfig failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update config", error: err.message });
  }
};

exports.acknowledgeLive = async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "password is required to acknowledge live trading" });
  }
  if (process.env.ALLOW_LIVE_TRADING !== "true") {
    return res.status(403).json({
      success: false,
      code: "LIVE_DISABLED_BY_SERVER",
      message: "Live trading is disabled on this server.",
    });
  }
  try {
    // Re-fetch the user to access the password hash (req.user is the
    // middleware-fetched instance; it does already have password, but be
    // explicit so this won't break if the model adds attribute exclusion).
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }
    const cfg = await findOrCreateConfig(req.user.id);
    await cfg.update({ liveAcknowledgedAt: new Date() });
    return res.json({ success: true, data: serialize(cfg) });
  } catch (err) {
    console.error("acknowledgeLive failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to record acknowledgement", error: err.message });
  }
};

exports.engageKillSwitch = async (req, res) => {
  try {
    const cfg = await findOrCreateConfig(req.user.id);
    const reason = req.body?.reason || "User triggered kill switch";
    await cfg.update({
      enabled: false,
      killSwitchTriggered: true,
      killSwitchAt: new Date(),
      killSwitchReason: reason,
    });
    webhookDispatcher.dispatch(cfg, "kill_switch_engaged", {
      reason,
      trigger: "user",
    });
    return res.json({ success: true, data: serialize(cfg) });
  } catch (err) {
    console.error("engageKillSwitch failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to engage kill switch", error: err.message });
  }
};

exports.clearKillSwitch = async (req, res) => {
  try {
    const cfg = await findOrCreateConfig(req.user.id);
    await cfg.update({
      killSwitchTriggered: false,
      killSwitchAt: null,
      killSwitchReason: null,
      consecutiveFailures: 0,
    });
    return res.json({ success: true, data: serialize(cfg) });
  } catch (err) {
    console.error("clearKillSwitch failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to clear kill switch", error: err.message });
  }
};

exports.getLedger = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  try {
    const rows = await TradeLedger.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit,
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getLedger failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load ledger", error: err.message });
  }
};

/**
 * Roll the user's TradeLedger into a per-symbol position view.
 *
 * Net qty   = sum of filled buys − sum of filled sells (engine-placed only;
 *             status in {filled, submitted}).
 * Realized  = sum of `realizedPnlUsd` on filled sells.
 * Actions   = total ledger rows (any status) in the chosen window.
 *
 * This is engine-side only — for an authoritative position we still defer
 * to /trading/reconcile (which hits Binance directly).
 */
exports.positions = async (req, res) => {
  const windowDays = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  try {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const rows = await TradeLedger.findAll({
      where: { userId: req.user.id, createdAt: { [Op.gte]: since } },
      order: [["createdAt", "ASC"]],
      limit: 5000,
    });

    const bySymbol = new Map();
    for (const r of rows) {
      const sym = r.symbol;
      if (!bySymbol.has(sym)) {
        bySymbol.set(sym, {
          symbol: sym,
          netQty: 0,
          buyQty: 0,
          sellQty: 0,
          buyNotional: 0,
          sellNotional: 0,
          realizedPnlUsd: 0,
          fills: 0,
          dryRuns: 0,
          skips: 0,
          failures: 0,
          lastActionAt: r.createdAt,
        });
      }
      const agg = bySymbol.get(sym);
      const status = r.status;
      const qty = Number(r.qty || 0);
      const notional = Number(r.notionalUsd || 0);
      const pnl = Number(r.realizedPnlUsd || 0);
      agg.lastActionAt = r.createdAt;

      if (status === "filled" || status === "submitted") {
        if (r.side === "buy") {
          agg.buyQty += qty;
          agg.buyNotional += notional;
          agg.netQty += qty;
        } else {
          agg.sellQty += qty;
          agg.sellNotional += notional;
          agg.netQty -= qty;
        }
        agg.fills += 1;
        if (pnl) agg.realizedPnlUsd += pnl;
      } else if (status === "dry-run") {
        agg.dryRuns += 1;
      } else if (status === "skipped") {
        agg.skips += 1;
      } else if (status === "failed") {
        agg.failures += 1;
      }
    }

    const positions = Array.from(bySymbol.values()).map((p) => ({
      ...p,
      avgEntryPrice: p.buyQty > 0 ? p.buyNotional / p.buyQty : 0,
      avgExitPrice: p.sellQty > 0 ? p.sellNotional / p.sellQty : 0,
    }));

    // Symbols with non-trivial activity first.
    positions.sort((a, b) => Math.abs(b.netQty) - Math.abs(a.netQty) || b.fills - a.fills);

    return res.json({
      success: true,
      data: {
        windowDays,
        since: since.toISOString(),
        totalLedgerRows: rows.length,
        positions,
      },
    });
  } catch (err) {
    console.error("positions failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load positions", error: err.message });
  }
};

exports.reconcile = async (req, res) => {
  const symbol = String(req.query.symbol || "").toUpperCase();
  if (!symbol) {
    return res
      .status(400)
      .json({ success: false, message: "symbol query param is required" });
  }

  const keys = await UserApiKeys.findOne({
    where: { userId: req.user.id, exchange: "binance" },
  });
  if (!keys) {
    return res
      .status(412)
      .json({ success: false, code: "API_KEYS_MISSING", message: "No Binance API keys on file." });
  }

  let apiKey, apiSecret;
  try {
    apiKey = decrypt(keys.apiKeyEnc);
    apiSecret = decrypt(keys.apiSecretEnc);
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: `Could not decrypt API keys: ${e.message}` });
  }

  let trades = [];
  try {
    trades = await binance.getMyTrades({ apiKey, apiSecret, symbol });
  } catch (e) {
    return res
      .status(502)
      .json({ success: false, message: `Binance trade fetch failed: ${e.msg || e.message}` });
  }

  const ledger = await TradeLedger.findAll({
    where: {
      userId: req.user.id,
      symbol,
      exchangeOrderId: { [Op.not]: null },
    },
    order: [["createdAt", "DESC"]],
    limit: 200,
  });

  // Match by orderId first; fall back to clientOrderId (which Binance returns
  // as `clientOrderId` on the fill row).
  const engineByOrderId = new Map();
  const engineByClientId = new Map();
  for (const r of ledger) {
    if (r.exchangeOrderId) engineByOrderId.set(String(r.exchangeOrderId), r);
    if (r.clientOrderId) engineByClientId.set(String(r.clientOrderId), r);
  }

  // Dedupe Binance trades by orderId (one order = many fills).
  const ordersFromTrades = new Map();
  for (const t of trades) {
    const key = String(t.orderId);
    if (!ordersFromTrades.has(key)) {
      ordersFromTrades.set(key, {
        orderId: String(t.orderId),
        clientOrderId: t.clientOrderId || null,
        side: t.isBuyer ? "buy" : "sell",
        qty: 0,
        quoteQty: 0,
        time: t.time,
      });
    }
    const agg = ordersFromTrades.get(key);
    agg.qty += Number(t.qty);
    agg.quoteQty += Number(t.quoteQty);
    if (Number(t.time) > Number(agg.time)) agg.time = t.time;
  }

  const engineMatched = [];
  const manualOnly = [];
  for (const order of ordersFromTrades.values()) {
    const ledgerRow =
      engineByOrderId.get(order.orderId) ||
      (order.clientOrderId ? engineByClientId.get(order.clientOrderId) : null);
    const avgPrice = order.qty > 0 ? order.quoteQty / order.qty : 0;
    const enriched = {
      ...order,
      avgPrice,
      ledgerId: ledgerRow?.id ?? null,
    };
    if (ledgerRow) engineMatched.push(enriched);
    else if (
      order.clientOrderId &&
      String(order.clientOrderId).startsWith("qc-")
    ) {
      // qc-prefixed but no matching ledger row → engine order that never
      // wrote its ledger (e.g. server crash between the POST and the create).
      enriched.warning = "qc-tagged order with no ledger row";
      engineMatched.push(enriched);
    } else {
      manualOnly.push(enriched);
    }
  }

  const exchangeOrderIds = new Set(ordersFromTrades.keys());
  const ledgerOnly = ledger
    .filter((r) => r.exchangeOrderId && !exchangeOrderIds.has(String(r.exchangeOrderId)))
    .map((r) => ({
      id: r.id,
      side: r.side,
      status: r.status,
      orderId: r.exchangeOrderId,
      clientOrderId: r.clientOrderId,
      createdAt: r.createdAt,
    }));

  return res.json({
    success: true,
    data: {
      symbol,
      ledgerRows: ledger.length,
      binanceTradeRows: trades.length,
      binanceUniqueOrders: ordersFromTrades.size,
      engineMatched,
      manualOnly,
      ledgerOnly,
    },
  });
};

exports.testWebhook = async (req, res) => {
  try {
    const cfg = await findOrCreateConfig(req.user.id);
    if (!cfg.webhookUrl) {
      return res.status(400).json({
        success: false,
        code: "WEBHOOK_NOT_CONFIGURED",
        message: "Set a webhookUrl first.",
      });
    }
    const result = await webhookDispatcher.dispatchTest({
      userId: req.user.id,
      webhookUrl: cfg.webhookUrl,
      webhookSecret: cfg.webhookSecret,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res
      .status(err.status || 502)
      .json({ success: false, message: `Webhook test failed: ${err.message}` });
  }
};

exports.getWebhookDeliveries = async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  try {
    const rows = await WebhookDelivery.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit,
    });
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getWebhookDeliveries failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load deliveries", error: err.message });
  }
};

/** Rotate the webhook HMAC secret. Returns the new value exactly once. */
exports.rotateWebhookSecret = async (req, res) => {
  try {
    const cfg = await findOrCreateConfig(req.user.id);
    if (!cfg.webhookUrl) {
      return res.status(400).json({
        success: false,
        code: "WEBHOOK_NOT_CONFIGURED",
        message: "Set a webhookUrl first.",
      });
    }
    const next = webhookDispatcher.generateSecret();
    await cfg.update({ webhookSecret: next });
    const data = serialize(cfg);
    data.webhookSecret = next; // one-time reveal
    return res.json({ success: true, data });
  } catch (err) {
    console.error("rotateWebhookSecret failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to rotate webhook secret", error: err.message });
  }
};

exports.getPresets = (req, res) => {
  return res.json({ success: true, data: { presets: STRATEGY_PRESETS } });
};

exports.getStatus = async (req, res) => {
  try {
    const cfg = await findOrCreateConfig(req.user.id);
    const todayRows = await TradeLedger.findAll({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: startOfToday() },
      },
      attributes: ["status", "realizedPnlUsd", "side", "symbol"],
    });
    const pnlToday = todayRows.reduce(
      (sum, r) => sum + Number(r.realizedPnlUsd || 0),
      0
    );
    return res.json({
      success: true,
      data: {
        config: serialize(cfg),
        pnlTodayUsd: pnlToday,
        actionsToday: todayRows.length,
        atDailyLossLimit: pnlToday <= -Number(cfg.dailyLossLimitUsd),
      },
    });
  } catch (err) {
    console.error("getStatus failed", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load status", error: err.message });
  }
};
