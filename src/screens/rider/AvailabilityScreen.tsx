import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import RideOfferModal from '../../components/RideOfferModal';
import { GlyphTile } from '../../components/booking';
import { useAppConfig } from '../../context/AppConfigContext';
import { useRiderSocket } from '../../hooks/useRiderSocket';
import { acceptOffer, getPendingOffers, getRiderMe, rejectOffer, sendLocationPing, setAvailability } from '../../services/rider';
import { ApiError } from '../../services/api';
import { colors, font, radius, shadow, space } from '../../theme';
import { VEHICLE_META } from '../../types';
import type { RiderMe, RideOffer } from '../../types';
import type { RiderStackParamList, RiderTabParamList } from '../../navigation/RiderNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RiderTabParamList, 'Home'>,
  NativeStackScreenProps<RiderStackParamList>
>;

const LOCATION_PING_MS = 7000;
const OFFER_POLL_FALLBACK_MS = 5000;

// RiderNavigator's gate already guarantees `status === 'approved'` before
// this screen ever mounts (§ Become a Rider flow) — no need to re-check here.
export default function AvailabilityScreen({ navigation }: Props) {
  const { activeTrip, refresh } = useAppConfig();
  const [riderMe, setRiderMe] = useState<RiderMe | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<RideOffer | null>(null);
  const [accepting, setAccepting] = useState(false);

  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getRiderMe()
      .then((me) => {
        setRiderMe(me);
        setIsOnline(me.availability === 'online');
      })
      .catch(() => setRiderMe(null))
      .finally(() => setLoadingProfile(false));
  }, []);

  useEffect(() => {
    if (activeTrip) navigation.navigate('RiderTrip', { bookingId: activeTrip.id });
  }, [activeTrip, navigation]);

  const stopPings = useCallback(() => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
  }, []);

  const startPings = useCallback(() => {
    stopPings();
    pingInterval.current = setInterval(async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({});
        const speedKmph = pos.coords.speed && pos.coords.speed > 0 ? pos.coords.speed * 3.6 : 0;
        await sendLocationPing(pos.coords.latitude, pos.coords.longitude, speedKmph, pos.coords.heading ?? 0);
      } catch {
        // Best-effort — a missed ping is not fatal, the next one will land.
      }
    }, LOCATION_PING_MS);
  }, [stopPings]);

  useEffect(() => stopPings, [stopPings]);

  // Live offers over WS /ws/riders/me while online; REST poll only kicks in
  // as the hook's own fallback if the socket can't hold a connection.
  const pollOffers = useCallback(async () => {
    try {
      const offers = await getPendingOffers();
      setOffer((current) => current ?? offers[0] ?? null);
    } catch {
      // Ignore transient failures — the next tick retries.
    }
  }, []);

  useRiderSocket(
    isOnline && !activeTrip,
    (e) => setOffer((current) => current ?? { ...e }),
    { onResync: pollOffers, onPoll: pollOffers, pollMs: OFFER_POLL_FALLBACK_MS }
  );

  // Trip takes priority — stop showing offers once assigned one.
  useEffect(() => {
    if (activeTrip) setOffer(null);
  }, [activeTrip]);

  const handleToggle = async (next: boolean) => {
    setError(null);
    setToggling(true);
    try {
      if (next) {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          setError('Location permission is required to go online');
          setToggling(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        await setAvailability('online', pos.coords.latitude, pos.coords.longitude);
        setIsOnline(true);
        startPings();
      } else {
        await setAvailability('offline');
        setIsOnline(false);
        stopPings();
        setOffer(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update availability');
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async () => {
    if (!offer) return;
    setAccepting(true);
    try {
      const booking = await acceptOffer(offer.booking_id);
      setOffer(null);
      refresh();
      navigation.navigate('RiderTrip', { bookingId: booking.id });
    } catch {
      // 409 = someone else took it, or the window expired — dismiss quietly.
      setOffer(null);
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!offer) return;
    const bookingId = offer.booking_id;
    setOffer(null);
    try {
      await rejectOffer(bookingId);
    } catch {
      // Best-effort.
    }
  };

  if (loadingProfile || !riderMe) {
    return (
      <ScreenScaffold title="Rider Home">
        <ActivityIndicator color={colors.accentDark} />
      </ScreenScaffold>
    );
  }

  const meta = VEHICLE_META[riderMe.vehicle_type];

  return (
    <ScreenScaffold title="Rider Home" subtitle="Go online to receive ride requests">
      <View style={[styles.hero, isOnline && styles.heroOnline]}>
        <View style={styles.heroTop}>
          <GlyphTile icon={meta.icon} tone={isOnline ? 'accent' : 'dark'} />
          <View style={styles.heroBody}>
            <Text style={[styles.heroStatus, isOnline && styles.heroStatusOnline]}>
              {isOnline ? 'You’re online' : 'You’re offline'}
            </Text>
            <Text style={[styles.heroSub, isOnline && styles.heroSubOnline]}>
              {meta.label} · {riderMe.vehicle_number ?? '—'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            disabled={toggling}
            trackColor={{ true: colors.accent, false: colors.line300 }}
          />
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.statsRow}>
        <View style={styles.statHalf}><InfoCard label="Rating" value={riderMe.rating != null ? riderMe.rating.toFixed(1) : '—'} /></View>
        <View style={styles.statHalf}><InfoCard label="Total trips" value={String(riderMe.total_trips)} /></View>
      </View>

      <RideOfferModal
        offer={offer}
        accepting={accepting}
        onAccept={handleAccept}
        onReject={handleReject}
        onExpire={() => setOffer(null)}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: space.lg,
    ...shadow.card,
  },
  heroOnline: { backgroundColor: colors.navy800 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroBody: { flex: 1, gap: 2 },
  heroStatus: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy800 },
  heroStatusOnline: { color: colors.white },
  heroSub: { fontFamily: font.regular, fontSize: 13, color: colors.ink600 },
  heroSubOnline: { color: 'rgba(255,255,255,0.7)' },
  statsRow: { flexDirection: 'row', gap: space.md },
  statHalf: { flex: 1 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
