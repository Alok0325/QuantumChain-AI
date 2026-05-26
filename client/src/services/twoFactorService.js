import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const client = axios.create({
  baseURL: `${API_URL}/user/2fa`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = token;
  return cfg;
});

const unwrap = async (promise) => {
  try {
    const res = await promise;
    return res.data?.data ?? null;
  } catch (err) {
    const detail =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'unknown error';
    const wrapped = new Error(detail);
    wrapped.status = err?.response?.status;
    throw wrapped;
  }
};

const twoFactorService = {
  status: () => unwrap(client.get('/status')),
  setup: () => unwrap(client.post('/setup')),
  enable: (code) => unwrap(client.post('/enable', { code })),
  disable: (password, code) => unwrap(client.post('/disable', { password, code })),
  regenerateBackupCodes: (password) =>
    unwrap(client.post('/backup-codes', { password })),
};

export default twoFactorService;
