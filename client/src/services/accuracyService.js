import axios from 'axios';

const API_URL =
  process.env.REACT_APP_PREDICTION_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const wrap = (err, label) => {
  const detail =
    err?.response?.data?.detail ||
    err?.response?.data?.error ||
    err?.message ||
    'unknown error';
  const e = new Error(`${label} failed: ${detail}`);
  e.status = err?.response?.status;
  return e;
};

const accuracyService = {
  async forSymbol(symbol, lookbackDays = 14) {
    try {
      const res = await client.get('/accuracy', {
        params: { symbol, lookback_days: lookbackDays },
      });
      return res.data;
    } catch (err) {
      throw wrap(err, '/accuracy');
    }
  },

  async trainSymbol(symbol) {
    try {
      const res = await client.post('/train', { symbol });
      return res.data;
    } catch (err) {
      throw wrap(err, '/train');
    }
  },

  /** Parallel backtest across a symbol list. Returns one row per symbol with
   *  the result OR an `error` field on failure (never throws). */
  async forSymbols(symbols, lookbackDays = 14) {
    const out = await Promise.allSettled(
      symbols.map((s) => this.forSymbol(s, lookbackDays))
    );
    return symbols.map((symbol, i) => {
      const r = out[i];
      if (r.status === 'fulfilled') return { symbol, ...r.value };
      return { symbol, accuracy_pct: null, samples: 0, error: r.reason?.message };
    });
  },
};

export default accuracyService;
