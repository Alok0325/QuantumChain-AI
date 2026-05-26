import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const http = axios.create({ baseURL: API_URL, timeout: 15000 });

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readStored = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStored(USER_KEY));
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  // Wire token into all axios requests + auto-logout on 401.
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = token;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }

    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401 && token) {
          // Token rejected → flush local session.
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, [token]);

  const persist = (nextToken, nextUser) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(USER_KEY);
    setToken(nextToken);
    setUser(nextUser);
  };

  const login = useCallback(async ({ emailOrPhone, password, code }) => {
    setLoading(true);
    try {
      const { data } = await http.post('/user/auth/login', {
        emailOrPhone,
        password,
        ...(code ? { code } : {}),
      });
      persist(data.token, {
        id: data.user?.id,
        emailOrPhone,
        twoFactorEnabled: Boolean(data.user?.twoFactorEnabled),
      });
      return { success: true, user: data.user };
    } catch (err) {
      const payload = err?.response?.data || {};
      const serverCode = payload.code;
      if (serverCode === '2FA_REQUIRED' || serverCode === '2FA_INVALID') {
        return {
          success: false,
          requires2FA: true,
          message:
            serverCode === '2FA_INVALID'
              ? 'That authenticator code didn’t match. Try again.'
              : 'Enter the code from your authenticator app.',
        };
      }
      const msg = payload.error || payload.message || err?.message || 'Login failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ name, email, phone, password }) => {
    setLoading(true);
    try {
      await http.post('/user/auth/signUp', { name, email, phone, password });
      // Auto-login after successful signup
      const r = await login({ emailOrPhone: email, password });
      return r;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    persist(null, null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, isAuthed: Boolean(token) }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
