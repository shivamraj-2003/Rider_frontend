import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconArrowLeft, IconCash, IconQrcode } from '@tabler/icons-react-native';
import { useAppConfig } from '../../context/AppConfigContext';
import { createBooking, getFareQuote } from '../../services/customer';
import { ApiError } from '../../services/api';
import { colors, font, radius, shadow } from '../../theme';
import { Sheet, PaymentRow, FareBreakdown } from '../../components/booking';
import MapCanvas from '../../components/MapCanvas';
import { VEHICLE_META, rupees } from '../../types';
import type { FareQuote, PaymentMethod } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Payment'>;

// 10 · Payment + fare breakdown. Online is hidden unless payments_enabled (§12).
// 409 on POST /bookings = the customer already has a ride → go to it silently (§5).
export default function PaymentScreen({ navigation, route }: Props) {
  const { pickup, drop, estimate } = route.params;
  const { config, refresh } = useAppConfig();

  const [quote, setQuote] = useState<FareQuote | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFareQuote({
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      drop_lat: drop.lat,
      drop_lng: drop.lng,
      vehicle_type: estimate.vehicle_type,
    })
      .then(setQuote)
      .catch(() => setQuote(null)); // fall back to the estimate we already have
  }, [pickup, drop, estimate.vehicle_type]);

  const insets = useSafeAreaInsets();
  const total = quote?.fare ?? estimate.fare;
  const meta = VEHICLE_META[estimate.vehicle_type];

  const rows = quote
    ? [
        { label: 'Base fare', value: rupees(quote.base_fare) },
        { label: `Distance · ${quote.distance_km.toFixed(1)} km`, value: rupees(quote.distance_fare) },
        { label: `Time · ${quote.duration_min} min`, value: rupees(quote.time_fare) },
        ...(quote.waiting_charge
          ? [{ label: 'Waiting charge', value: rupees(quote.waiting_charge) }]
          : []),
        ...(quote.surge_multiplier > 1
          ? [{ label: `Surge ${quote.surge_multiplier}×`, value: 'applied' }]
          : []),
      ]
    : [
        {
          label: `${meta.label} · ${estimate.distance_km.toFixed(1)} km`,
          value: rupees(estimate.fare),
        },
      ];

  const book = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const booking = await createBooking({
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickup.address || pickup.name,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        drop_address: drop.address || drop.name,
        vehicle_type: estimate.vehicle_type,
        payment_method: method,
      });
      navigation.replace('SearchingRider', { booking, pickup, drop });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'conflict') {
        // Customer already has a ride — resync and let Home route to it. No dialog.
        await refresh().catch(() => {});
        navigation.navigate('Tabs');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Could not create the booking.');
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <MapCanvas center={pickup} pickup={pickup} pickupLabel={pickup.name} drop={drop} dropLabel={drop.name} dim />

      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.back, { top: insets.top + 8 }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <IconArrowLeft size={20} color={colors.navy800} strokeWidth={2} />
      </Pressable>

      <View style={styles.sheetWrap}>
        <Sheet onDismiss={() => navigation.goBack()}>
          <Text style={styles.title}>Payment</Text>

          <View style={styles.rows}>
            <PaymentRow
              label="Cash"
              sub="Pay the rider directly"
              icon={IconCash}
              selected={method === 'cash'}
              onPress={() => setMethod('cash')}
            />
            {config?.payments_enabled ? (
              <PaymentRow
                label="Pay online"
                sub="UPI, card or netbanking"
                icon={IconQrcode}
                selected={method === 'online'}
                onPress={() => setMethod('online')}
              />
            ) : null}
          </View>

          <FareBreakdown
            rows={rows}
            total={total}
            note="Final fare is calculated at drop-off from the distance actually driven."
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={book}
            disabled={busy}
            style={[styles.cta, busy && styles.ctaBusy]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaLabel}>
              {busy ? 'Booking…' : `Book ${meta.label.toLowerCase()} · ${rupees(total)}`}
            </Text>
          </Pressable>
        </Sheet>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBase },
  back: {
    position: 'absolute',
    left: 20,
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sheetWrap: { marginTop: 'auto' },
  title: { fontFamily: font.extrabold, fontSize: 20, letterSpacing: -0.4, color: colors.navy800 },
  rows: { gap: 10 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
  cta: {
    height: 58,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accent,
  },
  ctaBusy: { opacity: 0.7 },
  ctaLabel: { fontFamily: font.bold, fontSize: 17, color: colors.white },
});
