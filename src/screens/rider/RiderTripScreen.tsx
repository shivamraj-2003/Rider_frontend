import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { useAppConfig } from '../../context/AppConfigContext';
import { useBookingSocket } from '../../hooks/useBookingSocket';
import { getBooking } from '../../services/customer';
import { collectCash, completeTrip, markArrived, startTrip } from '../../services/rider';
import { ApiError } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';
import { TERMINAL_BOOKING_STATUSES } from '../../types';
import type { BookingOut } from '../../types';
import type { RiderStackParamList } from '../../navigation/RiderNavigator';

type Props = NativeStackScreenProps<RiderStackParamList, 'RiderTrip'>;

export default function RiderTripScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { refresh } = useAppConfig();
  const [booking, setBooking] = useState<BookingOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [cashCollected, setCashCollected] = useState(false);

  const resync = useCallback(async () => {
    try {
      const data = await getBooking(bookingId);
      setBooking(data);
      setError(null);
      if (TERMINAL_BOOKING_STATUSES.includes(data.status)) refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load trip status');
    }
  }, [bookingId, refresh]);

  useEffect(() => {
    resync();
  }, [resync]);

  // Live status over WS /ws/bookings/{id} — a cancellation from the customer's
  // side (rider_arrived/trip_started don't apply here since the rider caused
  // those) still needs a re-fetch to pick up the terminal status.
  useBookingSocket(bookingId, () => resync(), { onResync: resync, onPoll: resync });

  const handleArrived = async () => {
    setActing(true);
    setError(null);
    try {
      await markArrived(bookingId);
      await resync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update trip');
    } finally {
      setActing(false);
    }
  };

  const handleStart = async () => {
    setActing(true);
    setError(null);
    try {
      await startTrip(bookingId);
      await resync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start trip');
    } finally {
      setActing(false);
    }
  };

  const handleComplete = async () => {
    const distance = parseFloat(distanceKm);
    const duration = parseFloat(durationMin);
    if (!distance || !duration) {
      setError('Enter the distance and duration actually driven');
      return;
    }
    setActing(true);
    setError(null);
    try {
      await completeTrip(bookingId, distance, duration);
      await resync();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not complete trip');
    } finally {
      setActing(false);
    }
  };

  const handleCollectCash = async () => {
    setActing(true);
    setError(null);
    try {
      await collectCash(bookingId);
      setCashCollected(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not record cash collection');
    } finally {
      setActing(false);
    }
  };

  const finishAndReturn = async () => {
    // Wait for the resume-check to clear activeTrip first, or AvailabilityScreen's
    // "resume an active trip" effect would immediately navigate straight back here.
    await refresh();
    navigation.navigate('Tabs');
  };

  if (!booking) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      </View>
    );
  }

  const isCancelled = booking.status === 'cancelled_by_customer' || booking.status === 'cancelled_by_rider';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Trip</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusText}>{booking.status.replace(/_/g, ' ')}</Text>
        {booking.final_fare != null ? <Text style={styles.fare}>₹{booking.final_fare.toFixed(0)}</Text> : null}
      </View>

      <View style={styles.addressBlock}>
        <Text style={styles.addressLabel}>Pickup</Text>
        <Text style={styles.address}>{booking.pickup_address}</Text>
        <Text style={styles.addressLabel}>Drop</Text>
        <Text style={styles.address}>{booking.drop_address}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isCancelled ? (
        <Button title="Back to home" variant="secondary" onPress={finishAndReturn} />
      ) : booking.status === 'assigned' ? (
        <Button title="I've arrived" onPress={handleArrived} loading={acting} />
      ) : booking.status === 'arrived' ? (
        <Button title="Start trip" onPress={handleStart} loading={acting} />
      ) : booking.status === 'in_progress' ? (
        <View style={styles.completeForm}>
          <TextField
            label="Distance driven (km)"
            keyboardType="decimal-pad"
            value={distanceKm}
            onChangeText={setDistanceKm}
          />
          <TextField
            label="Duration (minutes)"
            keyboardType="decimal-pad"
            value={durationMin}
            onChangeText={setDurationMin}
          />
          <Button title="Complete trip" onPress={handleComplete} loading={acting} />
        </View>
      ) : booking.status === 'completed' ? (
        booking.payment_method === 'cash' && !cashCollected ? (
          <Button title="Collect cash" onPress={handleCollectCash} loading={acting} />
        ) : (
          <Button title="Done" onPress={finishAndReturn} />
        )
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1 },
  container: { padding: spacing.xl, gap: spacing.lg },
  title: { ...typography.h2, color: colors.primary },
  statusCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.xs },
  statusText: { ...typography.h3, color: colors.textInverse, textTransform: 'capitalize' },
  fare: { ...typography.body, color: colors.accent },
  addressBlock: { gap: 2 },
  addressLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm },
  address: { ...typography.bodyStrong, color: colors.textPrimary },
  error: { ...typography.caption, color: colors.danger },
  completeForm: { gap: spacing.md },
});
