import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { colors, font, radius } from '../../theme';
import { PlaceRow, TripRail } from '../../components/booking';
import { searchPlaces, getSavedPlaces, reverseGeocode } from '../../services/customer';
import { ApiError } from '../../services/api';
import type { Place, SavedPlace } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'DestinationSearch'>;

const DEBOUNCE_MS = 300; // /places/search is 60/min and costs Mapbox credits — §5
const MIN_CHARS = 3;

type Field = 'pickup' | 'drop';

function haversineKm(a: Place, b: Place): number {
  const dx = (b.lat - a.lat) * 111;
  const dy = (b.lng - a.lng) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

export default function DestinationSearchScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [pickup, setPickup] = useState<Place | null>(route.params?.pickup ?? null);
  const [drop, setDrop] = useState<Place | null>(route.params?.drop ?? null);
  // Ask for whichever end is still missing first.
  const [field, setField] = useState<Field>(route.params?.pickup ? 'drop' : 'pickup');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    getSavedPlaces()
      .then(setSaved)
      .catch(() => setSaved([]));
  }, []);

  // Debounced autocomplete.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setResults([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const near = pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined;
        setResults(await searchPlaces(q, near));
        setError(null);
      } catch (err) {
        setResults([]);
        setError(err instanceof ApiError ? err.message : 'Could not search. Try again.');
      } finally {
        setBusy(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, pickup]);

  const proceed = useCallback(
    (nextPickup: Place | null, nextDrop: Place | null) => {
      if (nextPickup && nextDrop) {
        navigation.navigate('RideSelect', { pickup: nextPickup, drop: nextDrop });
      }
    },
    [navigation]
  );

  const choose = (place: Place) => {
    setQuery('');
    setResults([]);
    if (field === 'pickup') {
      setPickup(place);
      if (drop) return proceed(place, drop);
      setField('drop');
      inputRef.current?.focus();
    } else {
      setDrop(place);
      if (pickup) return proceed(pickup, place);
      setField('pickup');
      inputRef.current?.focus();
    }
  };

  // Fallback for "on the map": no Mapbox yet, so use the device's current
  // position. TODO(phase-2): route to a pin-drop map screen instead.
  const useCurrentLocation = async () => {
    setError(null);
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setError('Location is turned off. Search for the place by name instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const place =
        (await reverseGeocode(pos.coords.latitude, pos.coords.longitude).catch(() => null)) ?? {
          place_id: 'current',
          name: 'Current location',
          address: '',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      choose(place);
    } catch {
      setError('Could not get your location. Search for the place by name instead.');
    }
  };

  const showSaved = query.trim().length < MIN_CHARS;
  const promptLabel = field === 'pickup' ? 'Search for a pickup point' : 'Search for a drop-off';

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Plan your trip</Text>
        </View>

        <TripRail
          pickup={pickup?.name || pickup?.address || 'Set pickup'}
          drop={drop?.name || drop?.address || ''}
          onPressPickup={() => {
            setField('pickup');
            setQuery('');
            inputRef.current?.focus();
          }}
          onPressDrop={() => {
            setField('drop');
            setQuery('');
            inputRef.current?.focus();
          }}
        />

        <View style={styles.field}>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder={promptLabel}
            placeholderTextColor={colors.ink400}
            selectionColor={colors.accent}
            style={styles.input}
            accessibilityLabel={promptLabel}
          />
          {busy ? <ActivityIndicator color={colors.accent} /> : null}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
      >
        <Text style={styles.section}>{showSaved ? 'SAVED PLACES' : 'SUGGESTIONS'}</Text>

        {showSaved
          ? saved.map((p) => (
              <PlaceRow key={p.id} name={p.label} address={p.address} saved onPress={() => choose(p)} />
            ))
          : results.map((p) => (
              <PlaceRow
                key={p.place_id}
                name={p.name}
                address={p.address}
                distanceKm={pickup ? haversineKm(pickup, p) : undefined}
                onPress={() => choose(p)}
              />
            ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!showSaved && !busy && results.length === 0 && !error ? (
          <Text style={styles.empty}>No matches. Try a landmark or a full address.</Text>
        ) : null}

        {showSaved && saved.length === 0 ? (
          <Text style={styles.empty}>Type at least {MIN_CHARS} letters to search.</Text>
        ) : null}

        <Pressable
          onPress={useCurrentLocation}
          style={styles.mapBtn}
          accessibilityRole="button"
        >
          <Text style={styles.mapBtnLabel}>Use current location</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    backgroundColor: colors.surface50,
    paddingHorizontal: 22,
    paddingBottom: 18,
    gap: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 17, color: colors.navy800 },
  headerTitle: { fontFamily: font.bold, fontSize: 17, color: colors.navy800 },
  field: {
    height: 56,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line200,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },
  input: { flex: 1, fontFamily: font.semibold, fontSize: 16, color: colors.navy800, padding: 0 },
  list: { paddingHorizontal: 22 },
  listContent: { paddingBottom: 32 },
  section: {
    fontFamily: font.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ink400,
    paddingTop: 16,
    paddingBottom: 4,
  },
  empty: {
    fontFamily: font.regular,
    fontSize: 14,
    color: colors.ink400,
    paddingVertical: 24,
    textAlign: 'center',
  },
  error: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.danger,
    paddingVertical: 16,
    textAlign: 'center',
  },
  mapBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnLabel: { fontFamily: font.semibold, fontSize: 15, color: colors.navy800 },
});
