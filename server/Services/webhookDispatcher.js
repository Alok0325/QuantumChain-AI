/**
 * Fire-and-forget webhook dispatcher for engine events.
 *
 * Posts a small JSON envelope to a user-configured HTTPS URL with an
 * HMAC-SHA256 signature header so receivers can verify the request came
 * from this engine.
 *
 * Headers on every delivery:
 *   X-QC-Event:     the event name (e.g. "kill_switch_engaged")
 *   X-QC-Signature: sha256=<hex(hmac_sha256(secret, body))> — only when a
 *                   `webhookSecret` is configured on the user's auto-trade
 *                   config. Verify on your side; mismatches mean tampering.
 *
 * Safety:
 *   - Only https:// URLs accepted (enforced at the model + here).
 *   - Short 5s timeout — never blocks the engine tick.
 *   - Payload contains *no secrets* — never API keys, never decrypted values.
 *   - `config.webhookEvents` (when non-empty) filters which events fire.
 *   - Per-(userId, url) failure counter; circuit breaks after 5 strikes for
 *     30 minutes so a flapping endpoint can't pin the engine event loop.
 */
const axios = require("axios");
const crypto = require("crypto");
const metrics = require("./metrics");

const TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS || 5000);
const FAILURE_THRESHOLD = Number(process.env.WEBHOOK_FAILURE_THRESHOLD || 5);
const COOLDOWN_MS = Number(process.env.WEBHOOK_COOLDOWN_MS || 30 * 60 * 1000);
const MAX_RETRIES = Number(process.env.WEBHOOK_MAX_RETRIES || 2); // attempts after the first
const BASE_BACKOFF_MS = Number(process.env.WEBHOOK_BASE_BACKOFF_MS || 1000);

// Per-user audit retention. Keep at most this many rows OR rows newer than
// the age cap, whichever is more lenient. Pruning runs opportunistically on
// every insert (cheap enough at our scale; no separate cron needed).
const AUDIT_KEEP_ROWS = Number(process.env.WEBHOOK_AUDIT_KEEP_ROWS || 1000);
const AUDIT_KEEP_DAYS = Number(process.env.WEBHOOK_AUDIT_KEEP_DAYS || 30);

const failures = new Map(); // `${userId}:${url}` -> { count, openedAt }

const log = (level, msg, meta = {}) =>
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level, svc: "webhook", msg, ...meta,
  }));

function failureKey(userId, url) {
  return `${userId || 0}:${url}`;
}

function isCircuitOpen(key) {
  const state = failures.get(key);
  if (!state) return false;
  if (state.count < FAILURE_THRESHOLD) return false;
  if (Date.now() - state.openedAt > COOLDOWN_MS) {
    failures.delete(key);
    return false;
  }
  return true;
}

function markSuccess(key) {
  failures.delete(key);
}

function markFailure(key) {
  const state = failures.get(key) || { count: 0, openedAt: 0 };
  state.count++;
  if (state.count >= FAILURE_THRESHOLD && !state.openedAt) {
    state.openedAt = Date.now();
  }
  failures.set(key, state);
}

function buildHeaders(event, body, secret, timestamp) {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "QuantumChain-Engine/1",
    "X-QC-Event": event,
    "X-QC-Timestamp": timestamp,
  };
  if (secret) {
    // Sign over `${timestamp}.${body}` so the timestamp can't be swapped
    // without invalidating the signature — receivers verify both at once.
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    headers["X-QC-Signature"] = `sha256=${sig}`;
  }
  return headers;
}

function isEventAllowed(config, event) {
  const allow = config?.webhookEvents;
  if (!Array.isArray(allow) || allow.length === 0) return true; // null/[] = all
  return allow.includes(event);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isTransientStatus = (status) => {
  if (!status) return true; // network error → retry
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  return false;
};

async function pruneAuditForUser(userId) {
  if (userId == null) return;
  try {
    const { Op } = require("sequelize");
    const WebhookDelivery = require("../Models/Trading/WebhookDelivery");
    // 1. Drop everything older than the age cap.
    const cutoff = new Date(Date.now() - AUDIT_KEEP_DAYS * 24 * 60 * 60 * 1000);
    await WebhookDelivery.destroy({
      where: { userId, createdAt: { [Op.lt]: cutoff } },
    });
    // 2. If we still exceed the row cap, drop the oldest extras.
    const count = await WebhookDelivery.count({ where: { userId } });
    if (count > AUDIT_KEEP_ROWS) {
      const extras = await WebhookDelivery.findAll({
        where: { userId },
        order: [["createdAt", "ASC"]],
        attributes: ["id"],
        limit: count - AUDIT_KEEP_ROWS,
      });
      const ids = extras.map((r) => r.id);
      if (ids.length) {
        await WebhookDelivery.destroy({ where: { id: { [Op.in]: ids } } });
      }
    }
  } catch {
    // Pruning is best-effort.
  }
}

async function recordDelivery(row) {
  try {
    const WebhookDelivery = require("../Models/Trading/WebhookDelivery");
    await WebhookDelivery.create(row);
    await pruneAuditForUser(row.userId);
  } catch {
    // Audit failures never cascade.
  }
}

/** Generate a new HMAC secret. Caller persists it on the config and returns
 *  it to the user *once*. */
exports.generateSecret = () => crypto.randomBytes(32).toString("hex");

/** Mask a secret for display: first 4 + last 4 chars only. */
exports.maskSecret = (s) => {
  if (!s || s.length <= 12) return s ? "*".repeat(s.length) : "";
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
};

/**
 * Best-effort, non-blocking dispatch. Returns immediately; the HTTP POST
 * happens on the next tick.
 */
exports.dispatch = (config, event, data = {}) => {
  if (!config || !config.webhookUrl) return;
  if (!isEventAllowed(config, event)) {
    log("debug", "event_filtered", { userId: config.userId, event });
    return;
  }
  const url = config.webhookUrl;
  if (!/^https:\/\//i.test(url)) return;
  const userId = config.userId || null;
  const key = failureKey(userId, url);

  if (isCircuitOpen(key)) {
    log("debug", "circuit_open", { userId, event });
    return;
  }

  const timestamp = new Date().toISOString();
  const payload = { event, userId, timestamp, data };
  const body = JSON.stringify(payload);
  const headers = buildHeaders(event, body, config.webhookSecret, timestamp);

  setImmediate(async () => {
    const start = Date.now();
    let statusCode = null;
    let errMsg = null;
    let delivered = false;
    let attempts = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      attempts = attempt + 1;
      try {
        const res = await axios.post(url, body, { timeout: TIMEOUT_MS, headers });
        statusCode = res.status;
        delivered = true;
        errMsg = null;
        markSuccess(key);
        log("info", "dispatched", {
          userId, event, attempts, signed: !!config.webhookSecret,
        });
        break;
      } catch (err) {
        statusCode = err?.response?.status || null;
        errMsg = String(err?.response?.statusText || err.code || err.message || "").slice(0, 400);
        const transient = isTransientStatus(statusCode);
        if (transient && attempt < MAX_RETRIES) {
          // Exponential backoff with full jitter.
          const cap = BASE_BACKOFF_MS * 2 ** attempt;
          await sleep(Math.floor(Math.random() * cap));
          continue;
        }
        markFailure(key);
        metrics.engineErrors.inc({ stage: "webhook" });
        log("warn", "dispatch_failed", { userId, event, attempts, err: errMsg });
        break;
      }
    }

    await recordDelivery({
      userId,
      event,
      url,
      statusCode,
      delivered,
      responseMs: Date.now() - start,
      error: errMsg,
    });
  });
};

/** Synchronous variant for the explicit "test" endpoint — returns the result. */
exports.dispatchTest = async (config) => {
  const url = config?.webhookUrl;
  if (!url) throw new Error("No webhook URL configured.");
  if (!/^https:\/\//i.test(url)) throw new Error("webhookUrl must be https://");

  const timestamp = new Date().toISOString();
  const payload = {
    event: "test",
    userId: config.userId || null,
    timestamp,
    data: { message: "QuantumChain AI test event." },
  };
  const body = JSON.stringify(payload);
  const headers = buildHeaders("test", body, config.webhookSecret, timestamp);

  const start = Date.now();
  try {
    const res = await axios.post(url, body, { timeout: TIMEOUT_MS, headers });
    markSuccess(failureKey(config.userId, url));
    await recordDelivery({
      userId: config.userId || null,
      event: "test",
      url,
      statusCode: res.status,
      delivered: true,
      responseMs: Date.now() - start,
    });
    return { ok: true, status: res.status, signed: !!config.webhookSecret };
  } catch (err) {
    markFailure(failureKey(config.userId, url));
    const status = err?.response?.status;
    const detail = err?.response?.statusText || err.code || err.message;
    await recordDelivery({
      userId: config.userId || null,
      event: "test",
      url,
      statusCode: status || null,
      delivered: false,
      responseMs: Date.now() - start,
      error: String(detail || "").slice(0, 400),
    });
    const e = new Error(status ? `${status} ${detail}` : detail || "webhook test failed");
    e.status = status;
    throw e;
  }
};
