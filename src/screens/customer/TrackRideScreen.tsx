import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Share, Linking, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconAlertTriangle, IconMapPin, IconMessageCircle, IconPhone, IconShare, IconStarFilled } from '@tabler/icons-react-native';
import Button from '../../components/Button';
import CancelRideSheet from '../../components/CancelRideSheet';
import GradientCard from '../../components/GradientCard';
import MapCanvas from '../../components/MapCanvas';
import { useAppConfig } from '../../context/AppConfigContext';
import { useBookingSocket } from '../../hooks/useBookingSocket';
import { cancelBooking, getBooking, getLiveBooking } from '../../services/customer';
import { raiseAlert, shareTrip, stopSharingTrip } from '../../services/safety';
import { ApiError } from '../../services/api';
import { colors, font, radius, shadow, space } from '../../theme';
import { TERMINAL_BOOKING_STATUSES, VEHICLE_META } from '../../types';
import type { BookingLive, BookingOut } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'TrackRide'>;

const STATUS_LABELS: Record<string, string> = {
  requested: 'Looking for a nearby rider…',
  assigned: 'Rider is on the way',
  arrived: 'Rider has arrived',
  in_progress: 'Trip in progress',
  completed: 'Trip completed',
  cancelled_by_customer: 'You cancelled this ride',
  cancelled_by_rider: 'Rider cancelled this ride',
  no_riders_found: 'No riders were available',
};

export default function TrackRideScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { refresh } = useAppConfig();
  const [live, setLive] = useState<BookingLive | null>(null);
  const [booking, setBooking] = useState<BookingOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const resync = useCallback(async () => {
    try {
      const data = await getLiveBooking(bookingId);
      setLive(data);
      setError(null);
      if (data.status === 'completed') {
        navigation.replace('RateRide', { bookingId });
        return;
      }
      if (TERMINAL_BOOKING_STATUSES.includes(data.status)) refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load ride status');
    }
  }, [bookingId, refresh, navigation]);

  useEffect(() => {
    resync();
    // Pickup/drop coordinates + addresses aren't on the live snapshot — fetch
    // the full booking once for the map and route summary.
    getBooking(bookingId).then(setBooking).catch(() => {});
  }, [bookingId, resync]);

  // Live status/location over WS /ws/bookings/{id} — falls back to a REST
  // poll only while the socket can't hold a connection.
  useBookingSocket(bookingId, () => resync(), { onResync: resync, onPoll: resync });

  const handleCancel = async (reason: string) => {
    setCancelling(true);
    setError(null);
    try {
      await cancelBooking(bookingId, reason);
      setCancelSheetOpen(false);
      await resync();
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel this ride');
    } finally {
      setCancelling(false);
    }
  };

  const handleSos = () => {
    Alert.alert('Send an emergency alert?', 'This notifies your emergency contacts and Top Rider support.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: async () => {
          setSosSending(true);
          try {
            const pos = await Location.getCurrentPositionAsync({}).catch(() => null);
            await raiseAlert({
              booking_id: bookingId,
              alert_type: 'sos',
              lat: pos?.coords.latitude,
              lng: pos?.coords.longitude,
            });
            Alert.alert('Help is on the way', 'Your emergency contacts have been notified.');
          } catch {
            Alert.alert('Could not send alert', 'Please call emergency services directly if you are in danger.');
          } finally {
            setSosSending(false);
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (shared) {
        await stopSharingTrip(bookingId);
        setShared(false);
      } else {
        const { url_path } = await shareTrip(bookingId);
        setShared(true);
        await Share.share({ message: `Follow my ride on Top Rider: ${url_path}` });
      }
    } catch {
      // Best-effort — sharing failing shouldn't block the trip screen.
    } finally {
      setSharing(false);
    }
  };

  const isTerminal = live ? TERMINAL_BOOKING_STATUSES.includes(live.status) : false;
  // The backend refuses to cancel a trip that's already in progress (409) —
  // match that here so the button never invites a doomed tap.
  const canCancel = live ? !isTerminal && live.status !== 'in_progress' : false;
  const canShareOrSos = live ? !isTerminal && live.status !== 'requested' : false;
  const insets = useSafeAreaInsets();
  const rider = live?.rider ?? booking?.rider ?? null;

  const handleCall = () => {
    if (rider?.phone) Linking.openURL(`tel:${rider.phone}`);
  };
  const handleMessage = () => {
    if (rider?.phone) Linking.openURL(`sms:${rider.phone}`);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + space.lg }]}
    >
      <Text style={styles.title}>Your ride</Text>

      {!live ? (
        <ActivityIndicator color={colors.accentDark} />
      ) : (
        <>
          {booking && !isTerminal ? (
            <View style={styles.mapCard}>
              <MapCanvas
                pickup={{ lat: booking.pickup_lat, lng: booking.pickup_lng }}
                pickupLabel={booking.pickup_address}
                drop={{ lat: booking.drop_lat, lng: booking.drop_lng }}
                dropLabel={booking.drop_address}
                riderLocation={live.rider_location}
              />
            </View>
          ) : null}

          <GradientCard style={styles.statusCard}>
            <Text style={styles.statusText}>{STATUS_LABELS[live.status] ?? live.status}</Text>
            {live.eta_minutes != null && !isTerminal ? (
              <Text style={styles.eta}>ETA: {live.eta_minutes} min</Text>
            ) : null}
            {live.rider_location ? (
              <View style={styles.locationRow}>
                <IconMapPin size={14} color={colors.accent} strokeWidth={2} />
                <Text style={styles.location}>
                  Rider at {live.rider_location.lat.toFixed(4)}, {live.rider_location.lng.toFixed(4)}
                </Text>
              </View>
            ) : !isTerminal ? (
              <Text style={styles.location}>Locating rider…</Text>
            ) : null}
          </GradientCard>

          {rider && !isTerminal ? (
            <View style={styles.riderCard}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderAvatarLabel}>
                  {(rider.full_name?.trim()?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={styles.riderBody}>
                <Text style={styles.riderName}>{rider.full_name ?? 'Your rider'}</Text>
                <View style={styles.riderMetaRow}>
                  {rider.rating != null ? (
                    <View style={styles.ratingRow}>
                      <IconStarFilled size={12.5} color={colors.accent} />
                      <Text style={styles.riderMeta}>{rider.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.riderMeta}>
                    {VEHICLE_META[rider.vehicle_type].label} · {rider.vehicle_number ?? '—'}
                  </Text>
                </View>
              </View>
              <Pressable style={styles.riderAction} onPress={handleMessage} accessibilityRole="button" accessibilityLabel="Message rider">
                <IconMessageCircle size={19} color={colors.navy800} strokeWidth={1.9} />
              </Pressable>
              <Pressable style={[styles.riderAction, styles.callAction]} onPress={handleCall} accessibilityRole="button" accessibilityLabel="Call rider">
                <IconPhone size={19} color={colors.white} strokeWidth={1.9} />
              </Pressable>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {canShareOrSos ? (
            <View style={styles.safetyRow}>
              <Pressable style={styles.safetyButton} onPress={handleShare} disabled={sharing}>
                <IconShare size={18} color={colors.primary} strokeWidth={1.75} />
                <Text style={styles.safetyLabel}>{shared ? 'Stop sharing' : 'Share trip'}</Text>
              </Pressable>
              <Pressable style={[styles.safetyButton, styles.sosButton]} onPress={handleSos} disabled={sosSending}>
                <IconAlertTriangle size={18} color={colors.danger} strokeWidth={1.75} />
                <Text style={[styles.safetyLabel, styles.sosLabel]}>SOS</Text>
              </Pressable>
            </View>
          ) : null}

          {canCancel ? (
            <Button title="Cancel ride" variant="secondary" onPress={() => setCancelSheetOpen(true)} />
          ) : null}

          {isTerminal ? (
            <Button
              title="Back to booking"
              variant="secondary"
              onPress={() => navigation.navigate('Tabs')}
            />
          ) : null}
        </>
      )}

      <CancelRideSheet
        visible={cancelSheetOpen}
        busy={cancelling}
        warning={
          live?.status === 'assigned' || live?.status === 'arrived'
            ? 'A cancellation fee may apply since a rider is already on the way.'
            : undefined
        }
        onClose={() => setCancelSheetOpen(false)}
        onConfirm={handleCancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface50 },
  container: { padding: space.xl, gap: space.lg },
  title: { fontFamily: font.extrabold, fontSize: 24, letterSpacing: -0.4, color: colors.navy800 },
  statusCard: { padding: space.xl, gap: 6 },
  statusText: { fontFamily: font.extrabold, fontSize: 18, color: colors.white },
  eta: { fontFamily: font.semibold, fontSize: 14.5, color: colors.accent },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  location: { fontFamily: font.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' },
  mapCard: {
    height: 190,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadow.card,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: space.md,
    ...shadow.card,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.navy800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderAvatarLabel: { fontFamily: font.extrabold, fontSize: 18, color: colors.white },
  riderBody: { flex: 1, gap: 3 },
  riderName: { fontFamily: font.bold, fontSize: 15.5, color: colors.navy800 },
  riderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  riderMeta: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  riderAction: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callAction: { backgroundColor: colors.accent },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
  cancelSection: { gap: space.md },
  safetyRow: { flexDirection: 'row', gap: space.md },
  safetyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  sosButton: {},
  safetyLabel: { fontFamily: font.bold, fontSize: 14, color: colors.navy800 },
  sosLabel: { color: colors.danger },
});
