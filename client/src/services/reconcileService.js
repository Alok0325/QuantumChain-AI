import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const client = axios.create({
  baseURL: `${API_URL}/trading`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = token;
  return cfg;
});

const reconcileService = {
  async reconcile(symbol) {
    try {
      const res = await client.get('/reconcile', { params: { symbol } });
      return res.data?.data || null;
    } catch (err) {
      const payload = err?.response?.data || {};
      const wrapped = new Error(payload.message || err.message || 'reconcile failed');
      wrapped.status = err?.response?.status;
      wrapped.code = payload.code;
      throw wrapped;
    }
  },
};

export default reconcileService;
