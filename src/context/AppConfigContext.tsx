import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { configureMapbox } from '../components/MapCanvas';
import type { AppConfig, BookingOut } from '../types';

interface AppConfigContextValue {
  config: AppConfig | null;
  activeBooking: BookingOut | null; // customer's current ride, if any
  activeTrip: BookingOut | null; // rider's current trip, if any
  loading: boolean;
  // True once the first /config + resume check has finished for this session
  // (success or failure) — RootNavigator waits on this before picking a home
  // screen, so a resumable ride is never missed. Foreground refreshes after
  // that update `loading` without flipping this back to false.
  initialized: boolean;
  refresh: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

// Fetches GET /config and — per FRONTEND_INTEGRATION.md §1 and §3 — re-fetches
// it whenever the app comes back to the foreground, since a user's role can
// change while they're signed in. Also runs the crash-resume checks
// (GET /bookings/current, GET /riders/me/current-trip) so an in-progress ride
// survives an app restart.
export function AppConfigProvider({ children }: PropsWithChildren) {
  const { status, user } = useAuth();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [activeBooking, setActiveBooking] = useState<BookingOut | null>(null);
  const [activeTrip, setActiveTrip] = useState<BookingOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== 'signed-in') return;
    setLoading(true);
    try {
      const nextConfig = await api.get<AppConfig>('/config');
      setConfig(nextConfig);
      configureMapbox(nextConfig);

      if (nextConfig.role === 'customer') {
        const active = await api.get<BookingOut | null>('/bookings/current');
        setActiveBooking(active);
        setActiveTrip(null);
      } else if (nextConfig.role === 'rider') {
        const trip = await api.get<BookingOut | null>('/riders/me/current-trip');
        setActiveTrip(trip);
        setActiveBooking(null);
      } else {
        setActiveBooking(null);
        setActiveTrip(null);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'signed-in') {
      refresh();
    } else {
      setConfig(null);
      setActiveBooking(null);
      setActiveTrip(null);
      setInitialized(false);
    }
  }, [status, user?.role, refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(
    () => ({ config, activeBooking, activeTrip, loading, initialized, refresh }),
    [config, activeBooking, activeTrip, loading, initialized, refresh]
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within an AppConfigProvider');
  return ctx;
}
