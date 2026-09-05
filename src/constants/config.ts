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
