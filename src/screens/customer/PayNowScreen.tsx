import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import RazorpayCheckout, { type RazorpaySuccess } from '../../components/RazorpayCheckout';
import { createPaymentOrder, verifyPayment, type RazorpayOrder } from '../../services/payments';
import { ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, font, space } from '../../theme';
import { rupees } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'PayNow'>;

// Shown only for payment_method === 'online' bookings, right after the trip
// completes and Rider_backend has created a real Payment row for the final
// fare (§ trip complete). Cash bookings skip this screen entirely.
export default function PayNowScreen({ route, navigation }: Props) {
  const { bookingId, amount } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToRating = () => navigation.replace('RateRide', { bookingId });

  const startCheckout = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createPaymentOrder(bookingId);
      setOrder(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start the payment.');
      setBusy(false);
    }
  };

  const handleSuccess = async (result: RazorpaySuccess) => {
    setOrder(null);
    try {
      await verifyPayment(bookingId, result);
      Alert.alert('Payment received', 'Thanks! Your ride is fully paid.');
      goToRating();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Payment went through but could not be confirmed. Contact support if this repeats.'
      );
      setBusy(false);
    }
  };

  const handleFailed = (reason: string) => {
    setOrder(null);
    setBusy(false);
    setError(reason);
  };

  const handleDismiss = () => {
    setOrder(null);
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>Trip completed</Text>
        <Text style={styles.subtitle}>Pay for your ride to finish up.</Text>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount due</Text>
          <Text style={styles.amountValue}>{rupees(amount)}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Button title={`Pay ${rupees(amount)}`} onPress={startCheckout} loading={busy} />
        <Button title="Pay later" variant="secondary" onPress={goToRating} disabled={busy} />
      </View>

      <RazorpayCheckout
        order={order}
        contact={user?.phone}
        email={user?.email}
        onSuccess={handleSuccess}
        onFailed={handleFailed}
        onDismiss={handleDismiss}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28 },
  body: { flex: 1, justifyContent: 'center', gap: space.lg },
  title: {
    fontFamily: font.extrabold,
    fontSize: 24,
    letterSpacing: -0.4,
    color: colors.navy800,
    textAlign: 'center',
  },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.ink600, textAlign: 'center' },
  amountCard: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: space.lg,
    borderRadius: 20,
    backgroundColor: colors.surface50,
  },
  amountLabel: { fontFamily: font.medium, fontSize: 13, color: colors.ink400 },
  amountValue: { fontFamily: font.extrabold, fontSize: 36, color: colors.navy800 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger, textAlign: 'center' },
  footer: { gap: space.sm, paddingBottom: space.lg },
});
