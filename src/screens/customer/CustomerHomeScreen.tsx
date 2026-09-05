import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useAppConfig } from '../../context/AppConfigContext';
import { getSavedPlaces, reverseGeocode } from '../../services/customer';
import { colors, font, radius, shadow } from '../../theme';
import { Sheet, SavedPlaceCard } from '../../components/booking';
import MapCanvas from '../../components/MapCanvas';
import type { Place, SavedPlace } from '../../types';
import type { CustomerStackParamList, CustomerTabParamList } from '../../navigation/CustomerNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'Book'>,
  NativeStackScreenProps<CustomerStackParamList>
>;

// 07 · CustomerHome (route: Book tab). GET /bookings/current has already run in
// AppConfigProvider before this stack mounts (RootNavigator waits on it, §3) —
// if a ride is live we redirect to tracking before showing anything bookable.
export default function CustomerHomeScreen({ navigation }: Props) {
  const { config, activeBooking } = useAppConfig();
  const [pickup, setPickup] = useState<Place | null>(null);
  const [saved, setSaved] = useState<SavedPlace[]>([]);

  useEffect(() => {
    if (activeBooking) {
      navigation.navigate('TrackRide', { bookingId: activeBooking.id });
    }
  }, [activeBooking, navigation]);

  useEffect(() => {
    getSavedPlaces()
      .then(setSaved)
      .catch(() => setSaved([]));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude).catch(
          () => null
        );
        setPickup(
          place ?? {
            place_id: 'current',
            name: 'Current location',
            address: '',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }
        );
      } catch {
        // no location — user sets pickup on the next screen
      }
    })();
  }, []);

  const insets = useSafeAreaInsets();
  const bookingOff = config?.settings.booking_enabled.enabled === false;

  const toSearch = (drop?: Place) =>
    navigation.navigate('DestinationSearch', { pickup, drop: drop ?? null });

  return (
    <View style={styles.root}>
      <MapCanvas
        center={pickup}
        pickup={pickup}
      />

      <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
        <View style={styles.locChip}>
          <View style={styles.locDot} />
          <Text style={styles.locLabel} numberOfLines={1}>
            {pickup?.name ?? 'Locating…'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Account')}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Account"
        >
          <View style={styles.avatarDot} />
        </Pressable>
      </View>

      <View style={styles.sheetWrap}>
        <Sheet>
          <Text style={styles.title}>{bookingOff ? 'Booking paused' : 'Where are you going?'}</Text>

          {bookingOff ? (
            <Text style={styles.maintenance}>
              We&apos;ve paused new bookings for a short while. Please try again shortly.
            </Text>
          ) : (
            <>
              <Pressable
                onPress={() => toSearch()}
                style={styles.destField}
                accessibilityRole="button"
              >
                <View style={styles.locDot} />
                <Text style={styles.destPlaceholder}>Enter destination</Text>
              </Pressable>

              {saved.length > 0 ? (
                <View style={styles.savedRow}>
                  {saved.slice(0, 2).map((p) => (
                    <SavedPlaceCard
                      key={p.id}
                      label={p.label}
                      name={p.name || p.address}
                      onPress={() => toSearch(p)}
                    />
                  ))}
                </View>
              ) : null}

              <View style={styles.ctaRow}>
                <View style={styles.ctaCopy}>
                  <Text style={styles.ctaTitle}>Ride now</Text>
                  <Text style={styles.ctaSub}>Bike, auto or car</Text>
                </View>
                <Pressable onPress={() => toSearch()} style={styles.cta} accessibilityRole="button">
                  <Text style={styles.ctaLabel}>Book</Text>
                </Pressable>
              </View>
            </>
          )}
        </Sheet>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBase },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  avatarDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.navy800 },
  locChip: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  locDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  locLabel: { fontFamily: font.bold, fontSize: 13, color: colors.navy800, flexShrink: 1 },
  sheetWrap: { marginTop: 'auto' },
  title: { fontFamily: font.extrabold, fontSize: 21, letterSpacing: -0.4, color: colors.navy800 },
  maintenance: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.ink600 },
  destField: {
    height: 58,
    borderRadius: radius.control,
    backgroundColor: colors.surface100,
    borderWidth: 1.5,
    borderColor: colors.line200,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },
  destPlaceholder: { fontFamily: font.semibold, fontSize: 16, color: colors.ink400 },
  savedRow: { flexDirection: 'row', gap: 10 },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  ctaCopy: { gap: 2 },
  ctaTitle: { fontFamily: font.bold, fontSize: 14, color: colors.navy800 },
  ctaSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink400 },
  cta: {
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { fontFamily: font.bold, fontSize: 15, color: colors.white },
});
