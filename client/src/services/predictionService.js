import axios from 'axios';

const API_URL =
  process.env.REACT_APP_PREDICTION_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const unwrap = async (promise, label) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const detail = err?.response?.data?.detail || err?.response?.data?.error;
    const msg = detail || err?.message || 'unknown error';
    const wrapped = new Error(`${label} failed: ${msg}`);
    wrapped.status = err?.response?.status;
    wrapped.cause = err;
    throw wrapped;
  }
};

const naiveOfflineCandle = (symbol, anchorPrice = 30000) => {
  // Deterministic synthetic OHLC so the UI has something to show when the
  // FastAPI service is offline. Marked `demo: true` so the UI can warn.
  const seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const drift = ((seed % 13) - 6) / 100; // -6%..+6%
  const open = anchorPrice;
  const close = anchorPrice * (1 + drift);
  const high = Math.max(open, close) * 1.005;
  const low = Math.min(open, close) * 0.995;
  return { open, high, low, close };
};

export const predictionService = {
  health: () => unwrap(client.get('/health'), '/health'),

  predict: (symbol) =>
    unwrap(client.get('/predict', { params: { symbol } }), '/predict'),

  train: (symbol) => unwrap(client.post('/train', { symbol }), '/train'),

  rationale: (payload) =>
    unwrap(client.post('/rationale', payload), '/rationale'),

  accuracy: (symbol) =>
    unwrap(client.get('/accuracy', { params: { symbol } }), '/accuracy'),

  /**
   * Best-effort: try the live model, fall back to a synthetic prediction so
   * the UI can demo the AI flow even with no backend / no trained model.
   */
  async predictOrDemo(symbol, anchorPrice) {
    try {
      const data = await this.predict(symbol);
      return { ...data, demo: false };
    } catch (err) {
      return {
        symbol,
        prediction: naiveOfflineCandle(symbol, anchorPrice),
        horizon_hours: 1,
        model_version: 'demo',
        demo: true,
        reason: err.message,
      };
    }
  },

  // Back-compat aliases (older call sites)
  getPrediction(symbol) {
    return this.predict(symbol);
  },
  trainModel(symbol) {
    return this.train(symbol);
  },
  getHistoricalAccuracy(symbol) {
    return this.accuracy(symbol);
  },
};

export default predictionService;
