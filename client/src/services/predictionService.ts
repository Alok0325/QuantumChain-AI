import axios, { AxiosError, AxiosResponse } from 'axios';

import type {
  AccuracyResponse,
  Candle,
  HealthResponse,
  PredictionResponse,
  RationaleResponse,
} from '../types';

const API_URL =
  process.env.REACT_APP_PREDICTION_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

interface WrappedError extends Error {
  status?: number;
}

const unwrap = async <T>(
  promise: Promise<AxiosResponse<T>>,
  label: string
): Promise<T> => {
  try {
    const res = await promise;
    return res.data;
  } catch (raw) {
    const err = raw as AxiosError<{ detail?: string; error?: string }>;
    const detail = err?.response?.data?.detail || err?.response?.data?.error;
    const msg = detail || err?.message || 'unknown error';
    const wrapped: WrappedError = new Error(`${label} failed: ${msg}`);
    wrapped.status = err?.response?.status;
    throw wrapped;
  }
};

const naiveOfflineCandle = (symbol: string, anchorPrice = 30000): Candle => {
  const seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const drift = ((seed % 13) - 6) / 100;
  const open = anchorPrice;
  const close = anchorPrice * (1 + drift);
  const high = Math.max(open, close) * 1.005;
  const low = Math.min(open, close) * 0.995;
  return { open, high, low, close };
};

interface RationaleRequest {
  symbol: string;
  current_price: number;
  predicted: Candle;
  market_sentiment?: string | null;
}

interface PredictOrDemoResult extends PredictionResponse {
  reason?: string;
}

export const predictionService = {
  health: () => unwrap<HealthResponse>(client.get('/health'), '/health'),

  predict: (symbol: string) =>
    unwrap<PredictionResponse>(
      client.get('/predict', { params: { symbol } }),
      '/predict'
    ),

  train: (symbol: string) =>
    unwrap<{ symbol: string; status: string }>(
      client.post('/train', { symbol }),
      '/train'
    ),

  rationale: (payload: RationaleRequest) =>
    unwrap<RationaleResponse>(client.post('/rationale', payload), '/rationale'),

  accuracy: (symbol: string) =>
    unwrap<AccuracyResponse>(
      client.get('/accuracy', { params: { symbol } }),
      '/accuracy'
    ),

  async predictOrDemo(
    symbol: string,
    anchorPrice?: number
  ): Promise<PredictOrDemoResult> {
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
        reason: (err as Error).message,
      };
    }
  },

  // Back-compat aliases (older call sites)
  getPrediction(symbol: string) {
    return this.predict(symbol);
  },
  trainModel(symbol: string) {
    return this.train(symbol);
  },
  getHistoricalAccuracy(symbol: string) {
    return this.accuracy(symbol);
  },
};

export default predictionService;
