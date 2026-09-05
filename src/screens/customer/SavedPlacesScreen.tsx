import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconArrowLeft, IconMapPin } from '@tabler/icons-react-native';
import { getSavedPlaces, savePlace, searchPlaces } from '../../services/customer';
import { ApiError } from '../../services/api';
import { colors, font, radius, space } from '../../theme';
import TextField from '../../components/TextField';
import type { Place, SavedPlace } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'SavedPlaces'>;

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

// No delete-saved-place endpoint exists on the backend — this screen only
// lists and adds, matching what GET/POST /places/saved actually support.
export default function SavedPlacesScreen({ navigation }: Props) {
  const [places, setPlaces] = useState<SavedPlace[] | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    getSavedPlaces()
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPlaces(query.trim()));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSave = async (place: Place) => {
    setError(null);
    setSaving(place.place_id);
    try {
      await savePlace({ label: place.name, address: place.address, lat: place.lat, lng: place.lng });
      setQuery('');
      setResults([]);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this place.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconArrowLeft size={20} color={colors.navy800} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Saved places</Text>
      </View>

      <View style={styles.body}>
        <TextField placeholder="Search to add a place" value={query} onChangeText={setQuery} />
        {searching ? <ActivityIndicator color={colors.accentDark} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => handleSave(item)} disabled={saving === item.place_id}>
                <IconMapPin size={18} color={colors.ink400} strokeWidth={1.75} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{item.address}</Text>
                </View>
              </Pressable>
            )}
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>Your saved places</Text>
            {places === null ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.row}>
                    <IconMapPin size={18} color={colors.accentDark} strokeWidth={1.75} />
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{item.label}</Text>
                      <Text style={styles.rowSub} numberOfLines={1}>{item.address}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No saved places yet — search above to add one.</Text>}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: 28, paddingTop: 18 },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.line200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.extrabold, fontSize: 20, color: colors.navy800 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: space.lg, gap: space.md },
  sectionLabel: { fontFamily: font.bold, fontSize: 13, color: colors.ink600 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: font.bold, fontSize: 15, color: colors.navy800 },
  rowSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  empty: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink600 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
