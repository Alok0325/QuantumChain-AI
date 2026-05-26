/**
 * Prometheus metrics surface for the auto-trade engine and Binance wrapper.
 *
 * Exposed at `GET /metrics` (no auth — keep this endpoint behind a firewall in
 * production). All metric names are prefixed `qc_`.
 */
const client = require("prom-client");

client.collectDefaultMetrics({ prefix: "qc_" });

const tradeDecisions = new client.Counter({
  name: "qc_trade_decisions_total",
  help: "Auto-trade decisions written to the ledger.",
  labelNames: ["mode", "status", "side", "symbol"],
});

const tradeSkips = new client.Counter({
  name: "qc_trade_skips_total",
  help: "Decisions that were skipped (not executed).",
  labelNames: ["symbol", "reason_bucket"],
});

const liveOrders = new client.Counter({
  name: "qc_live_orders_total",
  help: "Live Binance orders placed by the engine.",
  labelNames: ["symbol", "side", "status"],
});

const engineErrors = new client.Counter({
  name: "qc_engine_errors_total",
  help: "Errors during engine ticks.",
  labelNames: ["stage"],
});

const killSwitches = new client.Counter({
  name: "qc_kill_switches_total",
  help: "Kill switches engaged.",
  labelNames: ["reason_bucket"],
});

const tickDuration = new client.Histogram({
  name: "qc_tick_seconds",
  help: "End-to-end duration of a single engine tick.",
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60, 120],
});

const binanceCallDuration = new client.Histogram({
  name: "qc_binance_call_seconds",
  help: "Per-call latency to Binance signed endpoints.",
  labelNames: ["endpoint", "outcome"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});

const binanceRetries = new client.Counter({
  name: "qc_binance_retries_total",
  help: "Binance call retry attempts.",
  labelNames: ["endpoint", "kind"],
});

/** Map a free-form reason string into a small bucket label. */
function bucketReason(reason) {
  if (!reason) return "unknown";
  const r = reason.toLowerCase();
  if (r.includes("confidence")) return "low_confidence";
  if (r.includes("stop-band") || r.includes("within stop")) return "below_threshold";
  if (r.includes("balance")) return "balance";
  if (r.includes("decrypt")) return "decrypt";
  if (r.includes("ack")) return "ack";
  if (r.includes("api key") || r.includes("no tested")) return "keys";
  if (r.includes("spot") || r.includes("sell signals")) return "spot_sell";
  if (r.includes("daily loss")) return "daily_loss";
  return "other";
}

module.exports = {
  register: client.register,
  client,
  tradeDecisions,
  tradeSkips,
  liveOrders,
  engineErrors,
  killSwitches,
  tickDuration,
  binanceCallDuration,
  binanceRetries,
  bucketReason,
};
