/**
 * Shared cache layer used by the circuit breaker (and anything else that
 * wants to live across process boundaries). Uses Redis when `REDIS_URL` is
 * set, otherwise an in-memory Map with TTL eviction.
 *
 * The API is intentionally tiny: `get`, `set(ttlSec)`, `del`, `incr(ttlSec)`.
 * Values are JSON-serialised on write and parsed on read so callers can
 * store objects directly.
 */
let client = null;
let backend = "memory";

const memory = new Map(); // key -> { val, exp }

function tryConnectRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return;
  try {
    const Redis = require("ioredis");
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    client.connect()
      .then(() => {
        backend = "redis";
        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          level: "info",
          svc: "cache",
          msg: "redis_connected",
          url: url.replace(/\/\/[^@]*@/, "//***@"), // mask creds
        }));
      })
      .catch((e) => {
        console.log(JSON.stringify({
          ts: new Date().toISOString(),
          level: "warn",
          svc: "cache",
          msg: "redis_connect_failed",
          err: e.message,
        }));
        client = null;
      });
    client.on("error", () => {
      // Silently swallow ioredis errors — we'll fall through to memory.
    });
  } catch (e) {
    // ioredis not installed or import failed; stay on memory.
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: "warn",
      svc: "cache",
      msg: "ioredis_import_failed",
      err: e.message,
    }));
    client = null;
  }
}

tryConnectRedis();

const memGet = (key) => {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.exp && Date.now() > entry.exp) {
    memory.delete(key);
    return null;
  }
  return entry.val;
};

exports.backend = () => (client ? "redis" : "memory");

exports.get = async (key) => {
  if (client) {
    try {
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // fall through to memory
    }
  }
  return memGet(key);
};

exports.set = async (key, val, ttlSec = 60) => {
  if (client) {
    try {
      await client.set(key, JSON.stringify(val), "EX", ttlSec);
      return;
    } catch {
      // fall through
    }
  }
  memory.set(key, { val, exp: ttlSec ? Date.now() + ttlSec * 1000 : null });
};

exports.del = async (key) => {
  if (client) {
    try { await client.del(key); return; } catch { /* fallthrough */ }
  }
  memory.delete(key);
};

exports.incr = async (key, ttlSec) => {
  if (client) {
    try {
      const v = await client.incr(key);
      if (v === 1 && ttlSec) await client.expire(key, ttlSec);
      return v;
    } catch { /* fall through */ }
  }
  const entry = memory.get(key);
  if (!entry || (entry.exp && Date.now() > entry.exp)) {
    memory.set(key, { val: 1, exp: ttlSec ? Date.now() + ttlSec * 1000 : null });
    return 1;
  }
  entry.val = (entry.val || 0) + 1;
  return entry.val;
};

exports.disconnect = async () => {
  if (client) {
    try { await client.quit(); } catch { /* ignore */ }
    client = null;
  }
  memory.clear();
};
