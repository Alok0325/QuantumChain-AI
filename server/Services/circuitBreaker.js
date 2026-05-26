/**
 * Per-key circuit breaker with optional Redis backing.
 *
 * State machine:
 *   closed     → calls flow normally; consecutive failures count up.
 *   open       → calls fail-fast with `CircuitOpenError` until the cooldown
 *                window elapses, then we move to half-open.
 *   half-open  → one trial call. Success → closed. Failure → open.
 *
 * Keyed by an arbitrary string (we use `${userId}:${endpoint}`). When
 * `REDIS_URL` is set the state lives in Redis so multiple Node instances
 * see the same breaker; otherwise it lives in-process.
 */
const cache = require("./distributedCache");
const metrics = require("./metrics");

const FAILURE_THRESHOLD = Number(process.env.CB_FAILURE_THRESHOLD || 5);
const OPEN_MS = Number(process.env.CB_OPEN_MS || 10 * 60 * 1000); // 10 min
const ENTRY_TTL_SEC = Number(process.env.CB_ENTRY_TTL_SEC || 60 * 60); // 1 h

const STATE_CLOSED = "closed";
const STATE_OPEN = "open";
const STATE_HALF = "half-open";

const KEY_PREFIX = "cb:";

class CircuitOpenError extends Error {
  constructor(key, retryInMs) {
    super(`circuit open for ${key} (retry in ~${Math.round(retryInMs / 1000)}s)`);
    this.code = "CIRCUIT_OPEN";
    this.key = key;
    this.retryInMs = retryInMs;
  }
}

async function loadState(key) {
  const raw = await cache.get(KEY_PREFIX + key);
  const base = raw || { state: STATE_CLOSED, failures: 0, openedAt: 0 };
  // Auto-promote: any caller seeing an expired-open entry treats it as half-open.
  if (base.state === STATE_OPEN && Date.now() - base.openedAt >= OPEN_MS) {
    return { ...base, state: STATE_HALF };
  }
  return base;
}

async function saveState(key, state) {
  await cache.set(KEY_PREFIX + key, state, ENTRY_TTL_SEC);
}

async function withBreaker(key, fn) {
  const state = await loadState(key);
  if (state.state === STATE_OPEN) {
    const retry = OPEN_MS - (Date.now() - state.openedAt);
    metrics.engineErrors.inc({ stage: "circuit_open" });
    throw new CircuitOpenError(key, retry);
  }
  try {
    const result = await fn();
    if (state.state !== STATE_CLOSED || state.failures > 0) {
      await saveState(key, { state: STATE_CLOSED, failures: 0, openedAt: 0 });
    }
    return result;
  } catch (err) {
    const failures = (state.failures || 0) + 1;
    let next;
    if (state.state === STATE_HALF || failures >= FAILURE_THRESHOLD) {
      next = { state: STATE_OPEN, failures, openedAt: Date.now() };
    } else {
      next = { state: STATE_CLOSED, failures, openedAt: 0 };
    }
    await saveState(key, next);
    throw err;
  }
}

async function reset(key) {
  await cache.del(KEY_PREFIX + key);
}

// In-process snapshot only — Redis-backed deploys should scrape via metrics.
async function snapshot() {
  return { backend: cache.backend() };
}

module.exports = {
  withBreaker,
  reset,
  snapshot,
  CircuitOpenError,
  STATE_CLOSED,
  STATE_OPEN,
  STATE_HALF,
};
