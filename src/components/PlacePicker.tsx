import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import TextField from './TextField';
import { searchPlaces } from '../services/customer';
import { colors, radius, spacing, typography } from '../theme';
import type { Place } from '../types';

interface Props {
  label: string;
  placeholder: string;
  value: Place | null;
  onSelect: (place: Place) => void;
}

// Debounced GET /places/search (300ms per FRONTEND_INTEGRATION.md §5) with a
// simple inline results dropdown. No map yet — Phase 7 adds pin-drop.
export default function PlacePicker({ label, placeholder, value, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const places = await searchPlaces(query.trim());
        setResults(places);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (place: Place) => {
    onSelect(place);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <TextField
        label={label}
        placeholder={value ? value.address : placeholder}
        value={query}
        onChangeText={(t) => {
          setQuery(t);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {value && !open ? <Text style={styles.selectedValue}>{value.address}</Text> : null}

      {open && (loading || results.length > 0) ? (
        <View style={styles.dropdown}>
          {loading ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : (
            results.map((place) => (
              <Pressable
                key={place.place_id}
                style={styles.row}
                onPress={() => handleSelect(place)}
              >
                <Text style={styles.rowName}>{place.name}</Text>
                <Text style={styles.rowAddress} numberOfLines={1}>
                  {place.address}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  selectedValue: { ...typography.caption, color: colors.textSecondary },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  loading: { padding: spacing.lg },
  row: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowName: { ...typography.bodyStrong, color: colors.textPrimary },
  rowAddress: { ...typography.caption, color: colors.textSecondary },
});
