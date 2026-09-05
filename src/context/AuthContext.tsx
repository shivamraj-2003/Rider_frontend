import React, { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { api, ApiError, setOnSignedOut, tokenStore } from '../services/api';
import type { Session, UserOut } from '../types';

type AuthStatus = 'loading' | 'signed-out' | 'needs-profile' | 'signed-in';

interface AuthContextValue {
  status: AuthStatus;
  user: UserOut | null;
  sendOtp: (phone: string) => Promise<{ expires_in: number; resend_in: number }>;
  verifyOtp: (phone: string, code: string) => Promise<Session>;
  completeProfile: (full_name: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserOut | null>(null);

  const applySession = (session: Session) => {
    setUser(session.user);
    setStatus(session.profile_complete ? 'signed-in' : 'needs-profile');
  };

  useEffect(() => {
    setOnSignedOut(() => {
      setUser(null);
      setStatus('signed-out');
    });

    (async () => {
      const refreshToken = await tokenStore.getRefreshToken();
      if (!refreshToken) {
        setStatus('signed-out');
        return;
      }
      // Trade the refresh token in immediately on cold start: it proves the
      // session is still alive and gives a fresh access token, so the first
      // real screen never starts with a 401 (FRONTEND_INTEGRATION.md §3).
      try {
        const session = await api.post<Session>('/auth/refresh', { refresh_token: refreshToken });
        await tokenStore.save(session);
        applySession(session);
      } catch {
        await tokenStore.clear();
        setStatus('signed-out');
      }
    })();
  }, []);

  const sendOtp = async (phone: string) => api.post<{ expires_in: number; resend_in: number }>('/auth/send-otp', { phone });

  const verifyOtp = async (phone: string, code: string) => {
    const session = await api.post<Session>('/auth/verify-otp', { phone, code });
    await tokenStore.save(session);
    applySession(session);
    return session;
  };

  const completeProfile = async (full_name: string, email?: string) => {
    const updated = await api.post<UserOut>('/auth/complete-profile', {
      full_name,
      ...(email ? { email } : {}),
    });
    setUser(updated);
    setStatus('signed-in');
  };

  const signOut = async () => {
    const refresh_token = await tokenStore.getRefreshToken();
    try {
      if (refresh_token) await api.post('/auth/logout', { refresh_token });
    } catch {
      // Best-effort — the local session is cleared either way.
    }
    await tokenStore.clear();
    setUser(null);
    setStatus('signed-out');
  };

  const value = useMemo(
    () => ({ status, user, sendOtp, verifyOtp, completeProfile, signOut }),
    [status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };
