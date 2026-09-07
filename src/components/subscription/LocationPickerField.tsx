import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { IconMapPin } from '@tabler/icons-react-native';
import { PlaceRow } from '../booking';
import { searchPlaces, reverseGeocode } from '../../services/customer';
import { colors, font, radius, space } from '../../theme';
import type { SubscriptionLocation } from '../../types';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 3;

// A compact, self-contained "search and pick one address" field, built for
// the commute-subscription wizard's Home/Office steps — same underlying
// /places/search + /places/reverse endpoints DestinationSearchScreen uses,
// just inline (expands in place) instead of its own full screen, since the
// wizard is deliberately one scrolling flow rather than five separate ones.
export default function LocationPickerField({
  label,
  tone,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  tone: 'accent' | 'danger';
  value: SubscriptionLocation | null;
  onChange: (loc: SubscriptionLocation) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SubscriptionLocation[]>([]);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < MIN_CHARS) {
      setResults([]);
      return;
    }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const places = await searchPlaces(q);
        setResults(places.map((p) => ({ address: p.address || p.name, lat: p.lat, lng: p.lng })));
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, open]);

  const choose = (loc: SubscriptionLocation) => {
    onChange(loc);
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude).catch(() => null);
      choose({
        address: place?.address || place?.name || 'Current location',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={styles.field}
        accessibilityRole="button"
      >
        <View style={[styles.iconTile, tone === 'accent' ? styles.accentTile : styles.dangerTile]}>
          <IconMapPin size={17} color={tone === 'accent' ? colors.accentDark : colors.danger} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>{label}</Text>
          <Text style={value ? styles.value : styles.placeholder} numberOfLines={1}>
            {value?.address ?? placeholder}
          </Text>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder={`Search for ${label.toLowerCase()}`}
            placeholderTextColor={colors.ink400}
            style={styles.input}
          />
          {busy ? <ActivityIndicator color={colors.accent} style={styles.spinner} /> : null}

          <Pressable onPress={useCurrentLocation} style={styles.currentBtn} disabled={locating}>
            <Text style={styles.currentBtnLabel}>
              {locating ? 'Locating…' : 'Use current location'}
            </Text>
          </Pressable>

          {results.map((r) => (
            <PlaceRow key={`${r.lat}-${r.lng}`} name={r.address} address="" onPress={() => choose(r)} />
          ))}
          {query.trim().length >= MIN_CHARS && !busy && results.length === 0 ? (
            <Text style={styles.empty}>No matches. Try a landmark or full address.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.control,
    backgroundColor: colors.surface50,
  },
  iconTile: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  accentTile: { backgroundColor: colors.accentTint },
  dangerTile: { backgroundColor: 'rgba(209,67,67,0.12)' },
  body: { flex: 1, gap: 1 },
  label: { fontFamily: font.medium, fontSize: 11, color: colors.ink400 },
  value: { fontFamily: font.bold, fontSize: 14.5, color: colors.navy800 },
  placeholder: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink400 },
  panel: {
    marginTop: space.sm,
    padding: space.sm,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line200,
    gap: 4,
  },
  input: {
    height: 44,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.line200,
    paddingHorizontal: 14,
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.navy800,
  },
  spinner: { marginTop: 8 },
  currentBtn: { paddingVertical: 10 },
  currentBtnLabel: { fontFamily: font.bold, fontSize: 13, color: colors.accentDark },
  empty: { fontFamily: font.regular, fontSize: 13, color: colors.ink400, textAlign: 'center', paddingVertical: 16 },
});
