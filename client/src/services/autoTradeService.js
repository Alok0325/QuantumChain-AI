import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const client = axios.create({
  baseURL: `${API_URL}/trading`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject the JWT (when real auth lands). Currently the AuthContext stores a
// mock user but no token, so requests will 401 and the client falls back to
// localStorage. The contract is ready for the day auth ships real tokens.
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
    if (err.response?.status === 401) return null; // not authed → caller falls back
    throw err;
  }
};

const unwrapStrict = async (promise) => {
  try {
    const res = await promise;
    return res.data?.data ?? null;
  } catch (err) {
    // Bubble up the server's structured error (code + message) so the UI
    // can branch on LIVE_DISABLED_BY_SERVER / LIVE_ACK_REQUIRED / etc.
    const payload = err?.response?.data || {};
    const wrapped = new Error(payload.message || err.message || 'request failed');
    wrapped.status = err?.response?.status;
    wrapped.code = payload.code;
    throw wrapped;
  }
};

const autoTradeService = {
  isAuthed() {
    return Boolean(localStorage.getItem('token'));
  },
  getConfig() {
    return unwrap(client.get('/config'));
  },
  // Strict variants throw the server's structured error for the UI to branch on.
  updateConfig(patch) {
    return unwrapStrict(client.put('/config', patch));
  },
  acknowledgeLive(password) {
    return unwrapStrict(client.post('/acknowledge-live', { password }));
  },
  engageKillSwitch(reason) {
    return unwrap(client.post('/kill-switch', { reason }));
  },
  clearKillSwitch() {
    return unwrap(client.delete('/kill-switch'));
  },
  getLedger(limit = 50) {
    return unwrap(client.get('/ledger', { params: { limit } }));
  },
  getStatus() {
    return unwrap(client.get('/status'));
  },
};

export default autoTradeService;
