// Central place for environment-dependent config.
// Values come from .env (see .env.example) — Expo only inlines vars prefixed
// EXPO_PUBLIC_ into the client bundle, so nothing secret can live here.

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill it in, then restart the dev server.`
    );
  }
  return value;
}

// Rider_backend's base URL, e.g. http://192.168.1.9:8000 — its routes are at
// the root (no /api/v1 prefix), so this is used as-is: `${API_URL}/auth/me`.
export const API_URL = requireEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL);

// WebSocket base — derived from API_URL (http→ws, https→wss) unless an explicit
// EXPO_PUBLIC_WS_URL is set. The backend accepts the token in the query string
// (§8), so this is just the origin.
export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? API_URL.replace(/^http(s?):\/\//, 'ws$1://');
