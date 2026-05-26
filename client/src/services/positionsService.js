import axios from 'axios';

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

const positionsService = {
  async positions(days = 30) {
    try {
      const res = await client.get('/positions', { params: { days } });
      return res.data?.data || null;
    } catch (err) {
      if (err?.response?.status === 401) return null;
      const detail =
        err?.response?.data?.message || err?.response?.data?.error || err?.message;
      const wrapped = new Error(detail || 'positions failed');
      wrapped.status = err?.response?.status;
      throw wrapped;
    }
  },
};

export default positionsService;
