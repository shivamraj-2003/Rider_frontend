import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import { colors, font, space } from '../../theme';
import { rupees } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'PayNow'>;

// Shown for payment_method === 'online' bookings right after the trip
// completes. The UPI QR is static (not tied to an amount), so the
// customer types the fare in their UPI app and the rider confirms receipt on
// their side - that is what marks the payment paid.
export default function PayNowScreen({ route, navigation }: Props) {
  const { bookingId, amount } = route.params;

  const goToRating = () => navigation.replace('RateRide', { bookingId });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Trip completed</Text>
        <Text style={styles.subtitle}>Scan the QR with any UPI app and pay your rider.</Text>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Enter this amount</Text>
          <Text style={styles.amountValue}>{rupees(amount)}</Text>
        </View>

        <Image
          source={require('../../../assets/payment-qr.png')}
          style={styles.qr}
          resizeMode="contain"
          accessibilityLabel="UPI payment QR code"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button title="I've paid" onPress={goToRating} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28 },
  body: { flexGrow: 1, justifyContent: 'center', gap: space.lg, paddingVertical: space.lg },
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
  qr: { width: '100%', height: 420, alignSelf: 'center' },
  footer: { gap: space.sm, paddingBottom: space.lg },
});
