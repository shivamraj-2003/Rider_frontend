import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapCanvas from '../../components/MapCanvas';
import { useBookingSocket } from '../../hooks/useBookingSocket';
import { getBooking, cancelBooking } from '../../services/customer';
import { ApiError } from '../../services/api';
import { colors, font, radius } from '../../theme';
import { VEHICLE_META, rupees } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'SearchingRider'>;

// 11 · SearchingRider. Socket opens immediately after POST /bookings; no polling
// (§5). rider_assigned → TrackRide, no_riders_found → its own screen.
export default function SearchingRiderScreen({ navigation, route }: Props) {
  const { booking: initial, pickup, drop } = route.params;
  const [booking, setBooking] = useState(initial);
  const [cancelling, setCancelling] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const routeForStatus = useCallback(
    (status: string) => {
      if (status === 'assigned' || status === 'arrived' || status === 'in_progress') {
        navigation.replace('TrackRide', { bookingId: booking.id });
      } else if (status === 'no_riders_found') {
        navigation.replace('NoRidersFound', { bookingId: booking.id, pickup, drop });
      } else if (status === 'cancelled_by_customer' || status === 'cancelled_by_rider') {
        navigation.navigate('Tabs');
      }
    },
    [navigation, booking.id, pickup, drop]
  );

  const resync = useCallback(async () => {
    try {
      const fresh = await getBooking(booking.id);
      setBooking(fresh);
      routeForStatus(fresh.status);
    } catch {
      // keep showing the searching state; the socket will catch up
    }
  }, [booking.id, routeForStatus]);

  useBookingSocket(
    booking.id,
    (e) => {
      switch (e.event) {
        case 'rider_assigned':
          return navigation.replace('TrackRide', { bookingId: booking.id });
        case 'no_riders_found':
          return navigation.replace('NoRidersFound', { bookingId: booking.id, pickup, drop });
        case 'booking_cancelled':
          return navigation.navigate('Tabs');
        default:
          return;
      }
    },
    { onResync: resync }
  );

  const confirmCancel = () => {
    Alert.alert('Cancel this ride?', 'A fee may apply once a rider has been assigned.', [
      { text: 'Keep searching', style: 'cancel' },
      {
        text: 'Cancel ride',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBooking(booking.id, 'Changed my mind');
            navigation.navigate('Tabs');
          } catch (err) {
            // The search can resolve (rider found, or no riders found) in the gap
            // between tapping Cancel and the request landing - a 409 here almost
            // always means the booking already moved on, not a real failure.
            if (err instanceof ApiError && err.status === 409) {
              await resync();
              setCancelling(false);
              return;
            }
            setCancelling(false);
            Alert.alert(
              'Could not cancel',
              err instanceof ApiError ? err.message : 'Please try again.'
            );
          }
        },
      },
    ]);
  };

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.9] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0, 0] });
  const meta = VEHICLE_META[booking.vehicle_type];
  const fareText = booking.quoted_fare != null ? `${rupees(booking.quoted_fare)} · ` : '';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.mapCard}>
        <MapCanvas
          pickup={{ lat: pickup.lat, lng: pickup.lng }}
          pickupLabel={pickup.name}
          drop={{ lat: drop.lat, lng: drop.lng }}
          dropLabel={drop.name}
          dim
        />
      </View>

      <View style={styles.center}>
        <View style={styles.halo}>
          <Animated.View style={[styles.pulse, { transform: [{ scale }], opacity }]} />
          <View style={styles.ring} />
          <View style={styles.badge}>
            <meta.icon size={28} color={colors.white} strokeWidth={1.75} />
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Finding your rider</Text>
          <Text style={styles.sub}>Matching you with the nearest {meta.label.toLowerCase()}</Text>
        </View>

        {booking.reference ? <Text style={styles.reference}>REF {booking.reference}</Text> : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <View style={styles.summaryDot} />
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>
              {fareText}
              {booking.payment_method === 'cash' ? 'Cash' : 'Online'}
            </Text>
            <Text style={styles.summarySub} numberOfLines={1}>
              {booking.pickup_address} → {booking.drop_address}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={confirmCancel}
          disabled={cancelling}
          style={styles.cancel}
          accessibilityRole="button"
        >
          <Text style={styles.cancelLabel}>{cancelling ? 'Cancelling…' : 'Cancel request'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy800 },
  mapCard: {
    height: 130,
    marginHorizontal: 22,
    marginTop: 8,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 30 },
  halo: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(232,121,43,0.28)',
  },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignItems: 'center', gap: 10 },
  title: { fontFamily: font.extrabold, fontSize: 24, letterSpacing: -0.3, color: colors.white },
  sub: { fontFamily: font.regular, fontSize: 15, color: 'rgba(255,255,255,0.62)' },
  reference: {
    fontFamily: font.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.42)',
  },
  footer: { paddingHorizontal: 22, gap: 14 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(232,121,43,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
  summaryBody: { flex: 1, gap: 2 },
  summaryTitle: {
    fontFamily: font.bold,
    fontSize: 14.5,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  summarySub: { fontFamily: font.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.55)' },
  cancel: {
    height: 54,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: { fontFamily: font.semibold, fontSize: 15.5, color: colors.white },
});
