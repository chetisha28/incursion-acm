'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'acm.session';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (!saved) { setLoading(false); return () => { active = false; }; }
    setToken(saved);
    api.me(saved).then((response) => {
      if (active) setUser(response.data);
    }).catch((error) => {
      if (active && error?.status === 401) clearSession();
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [clearSession]);

  const login = useCallback(async (kind, credentials) => {
    const response = await api.login(kind, credentials);
    const accessToken = response?.data?.token;
    if (!accessToken || !response?.data?.user) throw new ApiError('The service returned an incomplete sign-in response.');
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try { await api.logout(token); }
      catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
    }
    clearSession();
  }, [token, clearSession]);

  const value = useMemo(() => ({
    user, role: user?.role || 'VIEWER', token, loading,
    isAuthenticated: Boolean(user && token), login, logout, refreshUser: async () => {
      if (!token) return null;
      const response = await api.me(token);
      setUser(response.data);
      return response.data;
    }
  }), [user, token, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
