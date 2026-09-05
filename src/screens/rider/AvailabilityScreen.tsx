import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import RideOfferModal from '../../components/RideOfferModal';
import { useAppConfig } from '../../context/AppConfigContext';
import { acceptOffer, getPendingOffers, getRiderMe, rejectOffer, sendLocationPing, setAvailability } from '../../services/rider';
import { ApiError } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';
import type { RiderMe, RideOffer } from '../../types';
import type { RiderStackParamList, RiderTabParamList } from '../../navigation/RiderNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RiderTabParamList, 'Home'>,
  NativeStackScreenProps<RiderStackParamList>
>;

const LOCATION_PING_MS = 7000;
const OFFER_POLL_MS = 4000;

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
  const offerPollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const stopOfferPolling = useCallback(() => {
    if (offerPollInterval.current) {
      clearInterval(offerPollInterval.current);
      offerPollInterval.current = null;
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

  const startOfferPolling = useCallback(() => {
    stopOfferPolling();
    offerPollInterval.current = setInterval(async () => {
      try {
        const offers = await getPendingOffers();
        setOffer((current) => current ?? offers[0] ?? null);
      } catch {
        // Ignore transient failures — next poll retries.
      }
    }, OFFER_POLL_MS);
  }, [stopOfferPolling]);

  useEffect(() => stopPings, [stopPings]);
  useEffect(() => stopOfferPolling, [stopOfferPolling]);

  // Trip takes priority — stop hunting for offers once assigned one.
  useEffect(() => {
    if (activeTrip) {
      stopOfferPolling();
      setOffer(null);
    }
  }, [activeTrip, stopOfferPolling]);

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
        startOfferPolling();
      } else {
        await setAvailability('offline');
        setIsOnline(false);
        stopPings();
        stopOfferPolling();
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
      stopOfferPolling();
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

  if (loadingProfile) {
    return (
      <ScreenScaffold title="Rider Home">
        <ActivityIndicator color={colors.primary} />
      </ScreenScaffold>
    );
  }

  if (!riderMe) {
    return (
      <ScreenScaffold title="Rider Home" subtitle="Finish setting up your rider profile">
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            You haven't onboarded as a rider yet. Go to the Profile tab to add your vehicle
            details and documents.
          </Text>
        </View>
      </ScreenScaffold>
    );
  }

  if (riderMe.status !== 'approved') {
    const messages: Record<string, string> = {
      pending_verification: 'Your documents are under review. You will be able to go online once approved.',
      suspended: 'Your account is suspended. Contact support for help.',
      rejected: 'Your application was rejected. Contact support for details.',
    };
    return (
      <ScreenScaffold title="Rider Home" subtitle="Account status">
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>{messages[riderMe.status] ?? riderMe.status}</Text>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Rider Home" subtitle="Go online to receive ride requests">
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
        <Switch value={isOnline} onValueChange={handleToggle} disabled={toggling} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <InfoCard label="Vehicle" value={`${riderMe.vehicle_type} · ${riderMe.vehicle_number}`} />
      <InfoCard label="Rating" value={riderMe.rating != null ? riderMe.rating.toFixed(1) : '—'} />

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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  toggleLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.danger },
  noticeCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  noticeText: { ...typography.body, color: colors.textPrimary },
});
