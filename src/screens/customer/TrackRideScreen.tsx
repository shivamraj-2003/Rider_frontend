import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Share, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconAlertTriangle, IconShare } from '@tabler/icons-react-native';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { useAppConfig } from '../../context/AppConfigContext';
import { useBookingSocket } from '../../hooks/useBookingSocket';
import { cancelBooking, getLiveBooking } from '../../services/customer';
import { raiseAlert, shareTrip, stopSharingTrip } from '../../services/safety';
import { ApiError } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';
import { TERMINAL_BOOKING_STATUSES } from '../../types';
import type { BookingLive } from '../../types';
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
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
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
  }, [resync]);

  // Live status/location over WS /ws/bookings/{id} — falls back to a REST
  // poll only while the socket can't hold a connection.
  useBookingSocket(bookingId, () => resync(), { onResync: resync, onPoll: resync });

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      await cancelBooking(bookingId, cancelReason.trim() || 'Changed my mind');
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
  const canCancel = live ? !isTerminal : false;
  const canShareOrSos = live ? !isTerminal && live.status !== 'requested' : false;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your ride</Text>

      {!live ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>{STATUS_LABELS[live.status] ?? live.status}</Text>
            {live.eta_minutes != null && !isTerminal ? (
              <Text style={styles.eta}>ETA: {live.eta_minutes} min</Text>
            ) : null}
            {live.rider_location ? (
              <Text style={styles.location}>
                Rider at {live.rider_location.lat.toFixed(4)}, {live.rider_location.lng.toFixed(4)}
              </Text>
            ) : !isTerminal ? (
              <Text style={styles.location}>Locating rider…</Text>
            ) : null}
          </View>

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
            <View style={styles.cancelSection}>
              <TextField
                label="Cancellation reason (optional)"
                placeholder="Changed my mind"
                value={cancelReason}
                onChangeText={setCancelReason}
              />
              <Button title="Cancel ride" variant="secondary" onPress={handleCancel} loading={cancelling} />
            </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, gap: spacing.lg },
  title: { ...typography.h2, color: colors.primary },
  statusCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  statusText: { ...typography.h3, color: colors.textInverse },
  eta: { ...typography.body, color: colors.textInverse },
  location: { ...typography.caption, color: colors.accent },
  error: { ...typography.caption, color: colors.danger },
  cancelSection: { gap: spacing.md },
  safetyRow: { flexDirection: 'row', gap: spacing.md },
  safetyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  sosButton: { borderColor: colors.danger },
  safetyLabel: { ...typography.bodyStrong, color: colors.primary },
  sosLabel: { color: colors.danger },
});
