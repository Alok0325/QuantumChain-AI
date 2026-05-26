import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const client = axios.create({
  baseURL: `${API_URL}/user/api-keys`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = token;
  return cfg;
});

const unwrap = async (promise) => {
  const res = await promise;
  return res.data?.data ?? null;
};

const wrapError = (err) => {
  const detail =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'unknown error';
  const wrapped = new Error(detail);
  wrapped.status = err?.response?.status;
  return wrapped;
};

const apiKeysService = {
  async getBinance() {
    try {
      return await unwrap(client.get('/binance'));
    } catch (err) {
      if (err?.response?.status === 401) return null;
      throw wrapError(err);
    }
  },
  async setBinance(apiKey, apiSecret) {
    try {
      return await unwrap(client.put('/binance', { apiKey, apiSecret }));
    } catch (err) {
      throw wrapError(err);
    }
  },
  async deleteBinance() {
    try {
      return await unwrap(client.delete('/binance'));
    } catch (err) {
      throw wrapError(err);
    }
  },
  async testBinance() {
    try {
      return await unwrap(client.post('/binance/test'));
    } catch (err) {
      // Bubble up the server-side mask snapshot when present.
      const payload = err?.response?.data?.data;
      const wrapped = wrapError(err);
      wrapped.snapshot = payload;
      throw wrapped;
    }
  },
};

export default apiKeysService;
