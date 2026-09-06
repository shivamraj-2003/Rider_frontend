import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { IconBriefcase, IconChevronRight, IconHome, IconMapPin, IconStar } from '@tabler/icons-react-native';
import { useAppConfig } from '../../context/AppConfigContext';
import { getPopularPlaces, getSavedPlaces, reverseGeocode } from '../../services/customer';
import { getNearbyRiders } from '../../services/rider';
import { colors, font, radius, shadow } from '../../theme';
import { Sheet, GlyphTile, PlaceRow } from '../../components/booking';
import MapCanvas from '../../components/MapCanvas';
import { VEHICLE_META } from '../../types';
import type { NearbyRider, Place, PopularPlace, SavedPlace } from '../../types';
import type { CustomerStackParamList, CustomerTabParamList } from '../../navigation/CustomerNavigator';

// Home-screen convention: a saved place's own label picks its icon, falling
// back to a star for anything the customer named themselves.
function savedPlaceIcon(label: string) {
  const key = label.trim().toLowerCase();
  if (key === 'home') return IconHome;
  if (key === 'work') return IconBriefcase;
  return IconStar;
}

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
  const [popular, setPopular] = useState<PopularPlace[]>([]);
  const [nearbyRiders, setNearbyRiders] = useState<NearbyRider[]>([]);

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
    if (!pickup) return;
    getPopularPlaces(pickup.lat, pickup.lng)
      .then(setPopular)
      .catch(() => setPopular([]));
  }, [pickup]);

  // Real nearby-rider dots, refreshed while this screen is on screen — not a
  // WebSocket topic (there's no per-viewer "area" channel to subscribe to
  // pre-booking), but a cheap, focus-gated poll of just the marker data, not
  // the map itself, so the map view never reloads.
  const pollNearbyRiders = useCallback(() => {
    if (!pickup) return;
    getNearbyRiders(pickup.lat, pickup.lng)
      .then(setNearbyRiders)
      .catch(() => {});
  }, [pickup]);

  useFocusEffect(
    useCallback(() => {
      pollNearbyRiders();
      const t = setInterval(pollNearbyRiders, 6000);
      return () => clearInterval(t);
    }, [pollNearbyRiders])
  );

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
  const vehicleTypes = config?.vehicle_types ?? [];

  const toSearch = (drop?: Place) =>
    navigation.navigate('DestinationSearch', { pickup, drop: drop ?? null });

  return (
    <View style={styles.root}>
      <MapCanvas
        center={pickup}
        pickup={pickup}
        pickupLabel={pickup?.name}
        nearby={nearbyRiders.map((r) => ({
          id: r.rider_id,
          lat: r.lat,
          lng: r.lng,
          heading: r.heading,
          distanceKm: r.distance_km,
          vehicleType: r.vehicle_type,
        }))}
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

      <View style={styles.bottomGroup}>
        {!bookingOff && vehicleTypes.length > 0 ? (
          <View style={styles.fleetBanner}>
            <View style={styles.fleetIcons}>
              {vehicleTypes.map((v) => (
                <GlyphTile key={v} icon={VEHICLE_META[v].icon} tone="dark" />
              ))}
            </View>
            <View style={styles.fleetCopy}>
              <Text style={styles.fleetTitle}>Fast · Safe · Affordable</Text>
              <Text style={styles.fleetSub}>
                {vehicleTypes.map((v) => VEHICLE_META[v].label).join(' · ')} rides across the city
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.sheetWrap}>
          <Sheet>
            <Text style={styles.title}>{bookingOff ? 'Booking paused' : 'Where are you going?'}</Text>

            {bookingOff ? (
              <Text style={styles.maintenance}>
                We&apos;ve paused new bookings for a short while. Please try again shortly.
              </Text>
            ) : (
              <>
                <Pressable onPress={() => toSearch()} style={styles.placeField} accessibilityRole="button">
                  <View style={[styles.placeIconTile, styles.pickupIconTile]}>
                    <IconMapPin size={18} color={colors.accentDark} strokeWidth={2} />
                  </View>
                  <View style={styles.placeBody}>
                    <Text style={styles.placeLabel}>Pick-up location</Text>
                    <Text style={styles.placeValue} numberOfLines={1}>
                      {pickup?.name ?? 'Locating…'}
                    </Text>
                  </View>
                  <IconChevronRight size={18} color={colors.ink400} strokeWidth={2} />
                </Pressable>

                <Pressable onPress={() => toSearch()} style={styles.placeField} accessibilityRole="button">
                  <View style={[styles.placeIconTile, styles.dropIconTile]}>
                    <IconMapPin size={18} color={colors.danger} strokeWidth={2} />
                  </View>
                  <View style={styles.placeBody}>
                    <Text style={styles.placeLabel}>Where to?</Text>
                    <Text style={styles.destPlaceholder}>Enter destination</Text>
                  </View>
                  <IconChevronRight size={18} color={colors.ink400} strokeWidth={2} />
                </Pressable>

                {saved.length > 0 ? (
                  <View style={styles.savedSection}>
                    <Text style={styles.savedHeading}>Saved places</Text>
                    <View style={styles.savedGrid}>
                      {saved.slice(0, 3).map((p) => {
                        const Icon = savedPlaceIcon(p.label);
                        return (
                          <Pressable key={p.id} onPress={() => toSearch(p)} style={styles.savedTile}>
                            <Icon size={17} color={colors.navy800} strokeWidth={1.9} />
                            <Text style={styles.savedTileLabel} numberOfLines={1}>
                              {p.label}
                            </Text>
                            <Text style={styles.savedTileSub} numberOfLines={1}>
                              {p.name || p.address}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {popular.length > 0 ? (
                  <View style={styles.savedSection}>
                    <Text style={styles.savedHeading}>Popular near you</Text>
                    {popular.map((p) => (
                      <PlaceRow
                        key={p.address}
                        name={p.name}
                        address={p.address}
                        distanceKm={p.distance_km}
                        onPress={() =>
                          toSearch({ place_id: p.address, name: p.name, address: p.address, lat: p.lat, lng: p.lng })
                        }
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
  bottomGroup: { marginTop: 'auto' },
  fleetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  fleetIcons: { flexDirection: 'row', gap: 6 },
  fleetCopy: { flex: 1, gap: 2 },
  fleetTitle: { fontFamily: font.extrabold, fontSize: 14, color: colors.navy800 },
  fleetSub: { fontFamily: font.regular, fontSize: 12, color: colors.ink600 },
  sheetWrap: {},
  title: { fontFamily: font.extrabold, fontSize: 21, letterSpacing: -0.4, color: colors.navy800 },
  maintenance: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.ink600 },
  placeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.control,
    backgroundColor: colors.surface50,
  },
  placeIconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupIconTile: { backgroundColor: colors.accentTint },
  dropIconTile: { backgroundColor: 'rgba(209,67,67,0.12)' },
  placeBody: { flex: 1, gap: 1 },
  placeLabel: { fontFamily: font.medium, fontSize: 11.5, color: colors.ink400 },
  placeValue: { fontFamily: font.bold, fontSize: 15, color: colors.navy800 },
  destPlaceholder: { fontFamily: font.semibold, fontSize: 15, color: colors.ink400 },
  savedSection: { gap: 10 },
  savedHeading: { fontFamily: font.bold, fontSize: 13, color: colors.ink600 },
  savedGrid: { flexDirection: 'row', gap: 10 },
  savedTile: {
    flex: 1,
    gap: 6,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface50,
  },
  savedTileLabel: { fontFamily: font.bold, fontSize: 12.5, color: colors.navy800 },
  savedTileSub: { fontFamily: font.regular, fontSize: 10.5, color: colors.ink400 },
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
