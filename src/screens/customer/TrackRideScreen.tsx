import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { useAppConfig } from '../../context/AppConfigContext';
import { cancelBooking, getLiveBooking, rateBooking } from '../../services/customer';
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

const POLL_MS = 5000;

export default function TrackRideScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { refresh } = useAppConfig();
  const [live, setLive] = useState<BookingLive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const data = await getLiveBooking(bookingId);
      setLive(data);
      setError(null);
      if (TERMINAL_BOOKING_STATUSES.includes(data.status) && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        refresh();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load ride status');
    }
  }, [bookingId, refresh]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  const handleCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      await cancelBooking(bookingId, cancelReason.trim() || 'Changed my mind');
      await poll();
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel this ride');
    } finally {
      setCancelling(false);
    }
  };

  const handleRate = async () => {
    if (!rating) return;
    setSubmittingRating(true);
    setError(null);
    try {
      await rateBooking(bookingId, rating);
      setRatingSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const isTerminal = live ? TERMINAL_BOOKING_STATUSES.includes(live.status) : false;
  const canCancel = live ? !isTerminal : false;

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

          {live.status === 'completed' && !ratingSubmitted ? (
            <View style={styles.rateSection}>
              <Text style={styles.rateLabel}>Rate your trip</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(n)} hitSlop={6}>
                    <Text style={[styles.star, rating !== null && n <= rating ? styles.starFilled : null]}>★</Text>
                  </Pressable>
                ))}
              </View>
              <Button title="Submit rating" onPress={handleRate} loading={submittingRating} disabled={!rating} />
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
  rateSection: { gap: spacing.md, alignItems: 'flex-start' },
  rateLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  starsRow: { flexDirection: 'row', gap: spacing.sm },
  star: { fontSize: 32, color: colors.border },
  starFilled: { color: colors.accent },
});
