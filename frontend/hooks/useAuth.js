'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { DEMO_SESSION } from '@/components/dashboard/DemoPreviewData';

const AuthContext = createContext(null);

function hasOfflineDemoCookie() {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('cf_session=demo-preview-mode'));
}

export function enableOfflineDemoCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'cf_session=demo-preview-mode; path=/; max-age=86400; SameSite=Lax';
}

export function clearOfflineDemoCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'cf_session=; path=/; max-age=0; SameSite=Lax';
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [state, setState] = useState({
    user: null,
    business: null,
    role: 'owner',
    plan: { code: 'free', name: 'Free' },
    loading: true,
    isOfflineDemo: false,
    error: null,
  });

  const refreshAuth = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const payload = res?.data || res;
      if (payload?.user) {
        setState({
          user: payload.user,
          business: payload.business || DEMO_SESSION.business,
          role: payload.role || 'owner',
          plan: payload.plan || { code: 'free', name: 'Free' },
          loading: false,
          isOfflineDemo: false,
          error: null,
        });
        return payload;
      }
    } catch (err) {
      // If user explicitly activated offline demo preview or backend is unreachable with demo session cookie
      if (
        hasOfflineDemoCookie() ||
        (err instanceof ApiError && (err.status === 0 || err.status >= 502))
      ) {
        setState({
          ...DEMO_SESSION,
          loading: false,
          isOfflineDemo: true,
          error: null,
        });
        return DEMO_SESSION;
      }

      if (err instanceof ApiError && err.status === 401) {
        setState((prev) => ({
          ...prev,
          user: null,
          business: null,
          loading: false,
          isOfflineDemo: false,
          error: null,
        }));
        return null;
      }

      // Graceful fallback so dashboard preview stays usable even if API isn't started yet
      setState({
        ...DEMO_SESSION,
        loading: false,
        isOfflineDemo: true,
        error: err?.message || 'Backend API unreachable — showing interactive demo workspace.',
      });
      return DEMO_SESSION;
    }
    return null;
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(
    async ({ email, password }) => {
      clearOfflineDemoCookie();
      const res = await api.post('/auth/login', { email, password });
      await refreshAuth();
      return res?.data || res;
    },
    [refreshAuth]
  );

  const loginOfflineDemo = useCallback(() => {
    enableOfflineDemoCookie();
    setState({
      ...DEMO_SESSION,
      loading: false,
      isOfflineDemo: true,
      error: null,
    });
  }, []);

  const register = useCallback(
    async ({ name, email, password, businessName }) => {
      clearOfflineDemoCookie();
      const res = await api.post('/auth/register', { name, email, password, businessName });
      await refreshAuth();
      return res?.data || res;
    },
    [refreshAuth]
  );

  const loginWithGoogle = useCallback(
    async (payload) => {
      clearOfflineDemoCookie();
      const res = await api.post('/auth/google', payload);
      await refreshAuth();
      return res?.data || res;
    },
    [refreshAuth]
  );

  const logout = useCallback(async () => {
    clearOfflineDemoCookie();
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network error on logout
    }
    setState({
      user: null,
      business: null,
      role: 'owner',
      plan: { code: 'free', name: 'Free' },
      loading: false,
      isOfflineDemo: false,
      error: null,
    });
    router.push('/login');
  }, [router]);

  const updateBusinessState = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      business: prev.business ? { ...prev.business, ...patch } : patch,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isDemo: Boolean(state.business?.isDemo || state.isOfflineDemo),
      refreshAuth,
      login,
      loginWithGoogle,
      loginOfflineDemo,
      register,
      logout,
      updateBusinessState,
    }),
    [state, refreshAuth, login, loginWithGoogle, loginOfflineDemo, register, logout, updateBusinessState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      ...DEMO_SESSION,
      loading: false,
      isOfflineDemo: false,
      isDemo: true,
      refreshAuth: async () => {},
      login: async () => {},
      loginWithGoogle: async () => {},
      loginOfflineDemo: () => {},
      register: async () => {},
      logout: async () => {},
      updateBusinessState: () => {},
    };
  }
  return ctx;
}

export default useAuth;
