/**
 * Thin wrapper around Binance signed REST endpoints used by the live executor.
 *
 * Design rules:
 *   - Every call takes `apiKey` and `apiSecret` arguments (decrypted in the
 *     caller). Nothing is cached here so the secret only lives for the
 *     duration of the call.
 *   - `recvWindow=10000` (10s) — Binance rejects requests where their server
 *     time minus the request timestamp is larger than this.
 *   - Returns Binance's payload as-is on success; throws on failure with a
 *     normalized `{ status, code, msg }` shape so the engine can log cleanly.
 */
const axios = require("axios");
const { binanceSignature } = require("../Utils/crypto");
const metrics = require("./metrics");

const BASE_URL = process.env.BINANCE_BASE_URL || "https://api.binance.com";
const RECV_WINDOW = 10_000;
const MAX_RETRIES = Number(process.env.BINANCE_MAX_RETRIES || 3);
const BASE_BACKOFF_MS = Number(process.env.BINANCE_BASE_BACKOFF_MS || 400);

const http = axios.create({ baseURL: BASE_URL, timeout: 10_000 });

const norm = (err) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const e = new Error(data.msg || err.message || "binance error");
  e.status = status;
  e.code = data.code;
  e.msg = data.msg;
  return e;
};

const isTransient = (err) => {
  if (!err) return false;
  const code = err.code;
  const status = err.status;
  // Network: ECONNRESET, ETIMEDOUT, ECONNABORTED → no response.status
  if (status === undefined) return true;
  // 429 = rate limited; 418 = IP banned (still surfaces, but retrying briefly
  // can survive a short ban for some endpoints — only retry once on 418).
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  // Binance "system busy" code path
  if (code === -1003 || code === -1015) return true;
  return false;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn` with up to MAX_RETRIES attempts on transient errors. Exponential
 * backoff with full jitter. Each call observes `qc_binance_call_seconds` and
 * counts retries against `qc_binance_retries_total`.
 */
async function withRetry(endpoint, fn) {
  let attempt = 0;
  while (true) {
    const start = process.hrtime.bigint();
    let outcome = "ok";
    try {
      const result = await fn();
      const sec = Number(process.hrtime.bigint() - start) / 1e9;
      metrics.binanceCallDuration.observe({ endpoint, outcome }, sec);
      return result;
    } catch (raw) {
      const err = raw && raw.status !== undefined ? raw : norm(raw);
      outcome = isTransient(err) ? "transient" : "fail";
      const sec = Number(process.hrtime.bigint() - start) / 1e9;
      metrics.binanceCallDuration.observe({ endpoint, outcome }, sec);
      if (attempt >= MAX_RETRIES || !isTransient(err)) throw err;
      attempt++;
      metrics.binanceRetries.inc({ endpoint, kind: outcome });
      const cap = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      const delay = Math.floor(Math.random() * cap); // full jitter
      await sleep(delay);
    }
  }
}

const signed = (apiSecret, params) => {
  const ordered = { ...params, timestamp: Date.now(), recvWindow: RECV_WINDOW };
  const qs = Object.entries(ordered)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${qs}&signature=${binanceSignature(qs, apiSecret)}`;
};

/** Build a Binance-legal clientOrderId of the form `qc-{kind}-{userId}-{ts}-{rnd}`.
 * Max 36 chars per Binance spec; alphanumeric, `-`, `_`. */
function makeClientOrderId(kind, userId) {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  const u = String(userId || "0").slice(0, 8);
  return `qc-${kind}-${u}-${ts}-${rnd}`.slice(0, 36);
}
exports.makeClientOrderId = makeClientOrderId;

exports.getAccount = async ({ apiKey, apiSecret }) => {
  return withRetry("getAccount", async () => {
    try {
      const qs = signed(apiSecret, {});
      const r = await http.get(`/api/v3/account?${qs}`, {
        headers: { "X-MBX-APIKEY": apiKey },
      });
      return r.data;
    } catch (err) {
      throw norm(err);
    }
  });
};

/** Spot USDT balance, as a number. Returns 0 if asset row is missing. */
exports.getUsdtBalance = async ({ apiKey, apiSecret }) => {
  const acct = await exports.getAccount({ apiKey, apiSecret });
  const row = acct.balances?.find((b) => b.asset === "USDT");
  return row ? Number(row.free) : 0;
};

/** Free balance of the base asset (e.g. "BTC", "ETH"). Returns 0 if absent. */
exports.getBaseBalance = async ({ apiKey, apiSecret, asset }) => {
  const acct = await exports.getAccount({ apiKey, apiSecret });
  const row = acct.balances?.find((b) => b.asset === asset);
  return row ? Number(row.free) : 0;
};

/** Open orders for `${symbol}USDT`. Includes children of OCO orders. */
exports.getOpenOrders = async ({ apiKey, apiSecret, symbol }) => {
  return withRetry("getOpenOrders", async () => {
    try {
      const qs = signed(apiSecret, { symbol: `${symbol}USDT` });
      const r = await http.get(`/api/v3/openOrders?${qs}`, {
        headers: { "X-MBX-APIKEY": apiKey },
      });
      return r.data;
    } catch (err) {
      throw norm(err);
    }
  });
};

/**
 * Cancel every open order on `${symbol}USDT` so we can safely market-sell the
 * underlying balance without conflicting with a prior OCO bracket.
 *
 * Returns the Binance response (an array of cancelled orders) or null when
 * there was nothing to cancel — Binance returns -2011 in that case.
 */
exports.cancelAllOpenOrders = async ({ apiKey, apiSecret, symbol }) => {
  const start = process.hrtime.bigint();
  try {
    const qs = signed(apiSecret, { symbol: `${symbol}USDT` });
    const r = await http.delete(`/api/v3/openOrders?${qs}`, {
      headers: { "X-MBX-APIKEY": apiKey },
    });
    metrics.binanceCallDuration.observe(
      { endpoint: "cancelAllOpenOrders", outcome: "ok" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    return r.data;
  } catch (err) {
    const e = norm(err);
    if (e.code === -2011) {
      // "Unknown order sent" — nothing to cancel. Treat as ok.
      metrics.binanceCallDuration.observe(
        { endpoint: "cancelAllOpenOrders", outcome: "ok" },
        Number(process.hrtime.bigint() - start) / 1e9
      );
      return null;
    }
    metrics.binanceCallDuration.observe(
      { endpoint: "cancelAllOpenOrders", outcome: "fail" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    throw e;
  }
};

/**
 * Market SELL of `quantity` base units. Used to close an existing long on a
 * SELL signal — there is no shorting on spot.
 *
 * NOT retried (would risk double-sell).
 */
exports.marketSell = async ({ apiKey, apiSecret, symbol, quantity, userId }) => {
  const start = process.hrtime.bigint();
  try {
    const qs = signed(apiSecret, {
      symbol: `${symbol}USDT`,
      side: "SELL",
      type: "MARKET",
      quantity: trimFloat(quantity, 6),
      newClientOrderId: makeClientOrderId("sel", userId),
    });
    const r = await http.post(`/api/v3/order?${qs}`, null, {
      headers: { "X-MBX-APIKEY": apiKey },
    });
    metrics.binanceCallDuration.observe(
      { endpoint: "marketSell", outcome: "ok" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    return r.data;
  } catch (err) {
    metrics.binanceCallDuration.observe(
      { endpoint: "marketSell", outcome: "fail" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    throw norm(err);
  }
};

/**
 * Market BUY by quote notional. Avoids stepSize / lot-size math because
 * Binance computes the base quantity for us.
 *
 * Returns { symbol, orderId, status, executedQty, cummulativeQuoteQty, fills }.
 */
exports.marketBuy = async ({ apiKey, apiSecret, symbol, quoteOrderQty, userId }) => {
  // NOTE: marketBuy is NOT idempotent. We deliberately do NOT retry it —
  // a retry of "I think it failed" could double-buy. Only the duration is
  // observed; failures surface immediately.
  const start = process.hrtime.bigint();
  try {
    const qs = signed(apiSecret, {
      symbol: `${symbol}USDT`,
      side: "BUY",
      type: "MARKET",
      quoteOrderQty: quoteOrderQty.toFixed(2),
      newClientOrderId: makeClientOrderId("buy", userId),
    });
    const r = await http.post(`/api/v3/order?${qs}`, null, {
      headers: { "X-MBX-APIKEY": apiKey },
    });
    metrics.binanceCallDuration.observe(
      { endpoint: "marketBuy", outcome: "ok" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    return r.data;
  } catch (err) {
    metrics.binanceCallDuration.observe(
      { endpoint: "marketBuy", outcome: "fail" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    throw norm(err);
  }
};

/**
 * Place an OCO sell to bracket an existing long position with a take-profit
 * limit and a stop-loss trigger.
 *
 *   takeProfitPrice  → limit-sell price (price field in OCO)
 *   stopLossPrice    → trigger that activates the stop-limit sell
 *   stopLimitPrice   → set slightly below stopLossPrice so the limit fills
 *                       in adverse conditions
 *
 * Binance uses `/api/v3/order/oco`. The exact endpoint may differ; some
 * accounts use `/api/v3/orderList/oco`. We default to the older one for
 * widest compatibility.
 */
exports.placeOcoSell = async ({
  apiKey,
  apiSecret,
  symbol,
  quantity,
  takeProfitPrice,
  stopLossPrice,
  userId,
}) => {
  const stopLimitPrice = stopLossPrice * (1 - 0.001);
  // Not idempotent — don't retry. But we tag every leg with a clientOrderId
  // so a manual reconcile can spot orphan orders if a tick crashes mid-OCO.
  const start = process.hrtime.bigint();
  try {
    const qs = signed(apiSecret, {
      symbol: `${symbol}USDT`,
      side: "SELL",
      quantity: trimFloat(quantity, 6),
      price: trimFloat(takeProfitPrice, 2),
      stopPrice: trimFloat(stopLossPrice, 2),
      stopLimitPrice: trimFloat(stopLimitPrice, 2),
      stopLimitTimeInForce: "GTC",
      listClientOrderId: makeClientOrderId("oco", userId),
      limitClientOrderId: makeClientOrderId("tp", userId),
      stopClientOrderId: makeClientOrderId("sl", userId),
    });
    const r = await http.post(`/api/v3/order/oco?${qs}`, null, {
      headers: { "X-MBX-APIKEY": apiKey },
    });
    metrics.binanceCallDuration.observe(
      { endpoint: "placeOcoSell", outcome: "ok" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    return r.data;
  } catch (err) {
    metrics.binanceCallDuration.observe(
      { endpoint: "placeOcoSell", outcome: "fail" },
      Number(process.hrtime.bigint() - start) / 1e9
    );
    throw norm(err);
  }
};

exports.getOrder = async ({ apiKey, apiSecret, symbol, orderId }) => {
  return withRetry("getOrder", async () => {
    try {
      const qs = signed(apiSecret, { symbol: `${symbol}USDT`, orderId });
      const r = await http.get(`/api/v3/order?${qs}`, {
        headers: { "X-MBX-APIKEY": apiKey },
      });
      return r.data;
    } catch (err) {
      throw norm(err);
    }
  });
};

/**
 * Recent trade fills for the user on the given symbol. Returns one row per
 * fill (an order can produce multiple fills). Caller dedupes by `orderId`.
 */
exports.getMyTrades = async ({ apiKey, apiSecret, symbol, limit = 200 }) => {
  return withRetry("getMyTrades", async () => {
    try {
      const qs = signed(apiSecret, {
        symbol: `${symbol}USDT`,
        limit: Math.min(Math.max(Number(limit) || 200, 1), 1000),
      });
      const r = await http.get(`/api/v3/myTrades?${qs}`, {
        headers: { "X-MBX-APIKEY": apiKey },
      });
      return r.data;
    } catch (err) {
      throw norm(err);
    }
  });
};

function trimFloat(n, digits) {
  // Avoid scientific notation; Binance rejects "1e-6" style.
  return Number(n).toFixed(digits);
}
