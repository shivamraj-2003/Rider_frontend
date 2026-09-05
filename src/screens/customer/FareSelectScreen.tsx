import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenScaffold from '../../components/ScreenScaffold';
import Button from '../../components/Button';
import { useAppConfig } from '../../context/AppConfigContext';
import { createBooking, getFareEstimates } from '../../services/customer';
import { ApiError, api } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';
import type { BookingOut, FareEstimate, PaymentMethod, VehicleType } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'FareSelect'>;

const VEHICLE_LABELS: Record<VehicleType, string> = { bike: 'Bike', auto: 'Auto', car: 'Car' };

export default function FareSelectScreen({ route, navigation }: Props) {
  const { pickup, drop } = route.params;
  const { config } = useAppConfig();
  const [estimates, setEstimates] = useState<FareEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VehicleType | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFareEstimates({
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      drop_lat: drop.lat,
      drop_lng: drop.lng,
      vehicle_type: 'bike',
    })
      .then((rows) => {
        setEstimates(rows);
        if (rows.length > 0) setSelected(rows[0].vehicle_type);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load fares'))
      .finally(() => setLoading(false));
  }, [pickup, drop]);

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true);
    setError(null);
    try {
      const booking = await createBooking({
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickup.address,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        drop_address: drop.address,
        vehicle_type: selected,
        payment_method: payment,
      });
      navigation.replace('TrackRide', { bookingId: booking.id });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already has a ride in progress — go straight to it.
        const active = await api.get<BookingOut | null>('/bookings/current');
        if (active) {
          navigation.replace('TrackRide', { bookingId: active.id });
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : 'Could not book. Try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <ScreenScaffold title="Choose a ride" subtitle={`${pickup.name} → ${drop.name}`}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.list}>
          {estimates.map((row) => (
            <Pressable
              key={row.vehicle_type}
              style={[styles.card, selected === row.vehicle_type && styles.cardSelected]}
              onPress={() => setSelected(row.vehicle_type)}
            >
              <View>
                <Text style={styles.cardTitle}>{VEHICLE_LABELS[row.vehicle_type]}</Text>
                <Text style={styles.cardMeta}>
                  {row.distance_km.toFixed(1)} km · {row.duration_min} min
                </Text>
              </View>
              <Text style={styles.cardFare}>₹{row.fare.toFixed(0)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.sectionLabel}>Payment</Text>
      <View style={styles.savedRow}>
        {(['cash', 'online'] as PaymentMethod[]).map((method) => {
          const disabled = method === 'online' && config?.payments_enabled === false;
          return (
            <Pressable
              key={method}
              disabled={disabled}
              style={[styles.paymentChip, payment === method && styles.paymentChipSelected, disabled && styles.paymentChipDisabled]}
              onPress={() => setPayment(method)}
            >
              <Text style={[styles.paymentChipLabel, payment === method && styles.paymentChipLabelSelected]}>
                {method === 'cash' ? 'Cash' : 'Online (soon)'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.note}>Estimated fare — the final amount is based on the distance actually driven.</Text>

      <Button title="Confirm booking" onPress={handleConfirm} loading={confirming} disabled={!selected} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  cardSelected: { borderColor: colors.accent, borderWidth: 2 },
  cardTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cardFare: { ...typography.h3, color: colors.primary },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm },
  savedRow: { flexDirection: 'row', gap: spacing.sm },
  paymentChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  paymentChipSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  paymentChipDisabled: { opacity: 0.4 },
  paymentChipLabel: { ...typography.caption, color: colors.primary },
  paymentChipLabelSelected: { color: colors.textInverse },
  error: { ...typography.caption, color: colors.danger },
  note: { ...typography.caption, color: colors.textSecondary },
});
