import axios, { AxiosError, AxiosResponse } from 'axios';

import type {
  AutoTradeConfig,
  StrategyPreset,
  TradeLedgerRow,
  WebhookDelivery,
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const client = axios.create({
  baseURL: `${API_URL}/trading`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = token;
  return cfg;
});

type ApiResponse<T> = AxiosResponse<{ data?: T | null }>;

interface StructuredError extends Error {
  status?: number;
  code?: string;
}

const unwrap = async <T>(promise: Promise<ApiResponse<T>>): Promise<T | null> => {
  try {
    const res = await promise;
    return (res.data?.data ?? null) as T | null;
  } catch (raw) {
    const err = raw as AxiosError;
    if (err?.response?.status === 401) return null;
    throw err;
  }
};

const unwrapStrict = async <T>(promise: Promise<ApiResponse<T>>): Promise<T | null> => {
  try {
    const res = await promise;
    return (res.data?.data ?? null) as T | null;
  } catch (raw) {
    const err = raw as AxiosError<{ message?: string; code?: string; error?: string }>;
    const payload = err?.response?.data || {};
    const wrapped: StructuredError = new Error(
      payload.message || payload.error || err.message || 'request failed'
    );
    wrapped.status = err?.response?.status;
    wrapped.code = payload.code;
    throw wrapped;
  }
};

interface WebhookTestResult {
  ok: boolean;
  status: number;
  signed: boolean;
}

interface StatusResponse {
  config: AutoTradeConfig;
  pnlTodayUsd: number;
  actionsToday: number;
  atDailyLossLimit: boolean;
}

const autoTradeService = {
  isAuthed(): boolean {
    return Boolean(localStorage.getItem('token'));
  },
  getConfig(): Promise<AutoTradeConfig | null> {
    return unwrap<AutoTradeConfig>(client.get('/config'));
  },
  updateConfig(patch: Partial<AutoTradeConfig>): Promise<AutoTradeConfig | null> {
    return unwrapStrict<AutoTradeConfig>(client.put('/config', patch));
  },
  acknowledgeLive(password: string): Promise<AutoTradeConfig | null> {
    return unwrapStrict<AutoTradeConfig>(
      client.post('/acknowledge-live', { password })
    );
  },
  engageKillSwitch(reason?: string): Promise<AutoTradeConfig | null> {
    return unwrap<AutoTradeConfig>(client.post('/kill-switch', { reason }));
  },
  clearKillSwitch(): Promise<AutoTradeConfig | null> {
    return unwrap<AutoTradeConfig>(client.delete('/kill-switch'));
  },
  getLedger(limit = 50): Promise<TradeLedgerRow[] | null> {
    return unwrap<TradeLedgerRow[]>(
      client.get('/ledger', { params: { limit } })
    );
  },
  getStatus(): Promise<StatusResponse | null> {
    return unwrap<StatusResponse>(client.get('/status'));
  },
  async getPresets(): Promise<StrategyPreset[] | null> {
    try {
      const res = await client.get<{ data?: { presets?: StrategyPreset[] } }>('/presets');
      return res.data?.data?.presets ?? null;
    } catch {
      return null;
    }
  },
  testWebhook(): Promise<WebhookTestResult | null> {
    return unwrapStrict<WebhookTestResult>(client.post('/webhook/test'));
  },
  rotateWebhookSecret(): Promise<AutoTradeConfig | null> {
    return unwrapStrict<AutoTradeConfig>(client.post('/webhook/rotate-secret'));
  },
  getWebhookDeliveries(limit = 50): Promise<WebhookDelivery[] | null> {
    return unwrap<WebhookDelivery[]>(
      client.get('/webhook/deliveries', { params: { limit } })
    );
  },
};

export default autoTradeService;
