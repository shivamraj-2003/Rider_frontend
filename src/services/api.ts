// Thin REST client for Rider_backend. Implements the refresh-queueing rules
// from FRONTEND_INTEGRATION.md §14: at most one /auth/refresh call in flight
// process-wide, since a reused refresh token revokes every session.
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/config';
import type { Session } from '../types';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

const ACCESS_TOKEN_KEY = 'top_rider.access_token';
const REFRESH_TOKEN_KEY = 'top_rider.refresh_token';

export const tokenStore = {
  save: async (session: Pick<Session, 'access_token' | 'refresh_token'>) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
};

// Set by AuthContext so the client can react to a forced sign-out (e.g. a
// reused/expired refresh token) without importing React state in here.
let onSignedOut: () => void = () => {};
export function setOnSignedOut(handler: () => void) {
  onSignedOut = handler;
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const refresh_token = await tokenStore.getRefreshToken();
    if (!refresh_token) return null;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const session: Session = await res.json();
      await tokenStore.save(session);
      return session.access_token;
    } catch {
      await tokenStore.clear();
      onSignedOut();
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const token = await tokenStore.getAccessToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // fetch() only rejects on a transport failure — the server is unreachable
    // (not running, wrong EXPO_PUBLIC_API_URL, bound to 127.0.0.1 instead of
    // 0.0.0.0, blocked by a firewall, or no network). Surface that clearly
    // instead of letting each screen show its own generic "try again".
    console.warn(`[api] ${method} ${path} → network error (${API_URL}):`, err);
    throw new ApiError(
      'network_error',
      `Can't reach the server at ${API_URL}. Check that the backend is running and reachable from this device.`,
      0
    );
  }

  // Expired access token: refresh once, then replay the original request.
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    const fresh = await refreshAccessToken();
    if (fresh) return request<T>(method, path, body, false);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json.error ?? {};
    // Every response carries X-Request-ID; quoting it makes a bug report
    // answerable in seconds (FRONTEND_INTEGRATION.md §4).
    const requestId = res.headers.get('X-Request-ID') ?? undefined;
    if (requestId) {
      console.warn(`[api] ${method} ${path} → ${res.status} ${e.code ?? 'unknown'} (X-Request-ID: ${requestId})`);
    }
    throw new ApiError(e.code ?? 'unknown', e.message ?? 'Something went wrong', res.status, {
      ...(e.details ?? {}),
      ...(requestId ? { request_id: requestId } : {}),
    });
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
