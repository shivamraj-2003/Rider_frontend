import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenScaffold from '../../components/ScreenScaffold';
import { GlyphTile } from '../../components/booking';
import { getBookings } from '../../services/customer';
import { ApiError } from '../../services/api';
import { colors, font, radius, shadow, space } from '../../theme';
import { VEHICLE_META, rupees } from '../../types';
import type { BookingOut, BookingStatus } from '../../types';

type Filter = 'all' | 'completed' | 'cancelled';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  requested: 'Searching',
  assigned: 'Rider assigned',
  arrived: 'Rider arrived',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_rider: 'Cancelled by rider',
  no_riders_found: 'No riders found',
};

const CANCELLED_STATUSES: BookingStatus[] = ['cancelled_by_customer', 'cancelled_by_rider', 'no_riders_found'];

// Maps to Agreement section 3: booking and ride history.
export default function RideHistoryScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [bookings, setBookings] = useState<BookingOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // The backend filters by a single BookingStatus, not a group — "cancelled"
      // is 3 statuses, so fetch unfiltered and group client-side instead.
      const page = await getBookings({ limit: 50 });
      setBookings(page.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your ride history.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = (bookings ?? []).filter((b) => {
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return CANCELLED_STATUSES.includes(b.status);
    return true;
  });

  return (
    <ScreenScaffold title="Ride History">
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.tab, filter === f.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, filter === f.key && styles.tabLabelActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {bookings === null && !error ? (
        <ActivityIndicator color={colors.accentDark} />
      ) : error ? (
        <Pressable onPress={load} style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.retry}>Tap to retry</Text>
        </Pressable>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => <RideRow booking={item} />}
          ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
          ListEmptyComponent={<Text style={styles.empty}>No rides yet.</Text>}
        />
      )}
    </ScreenScaffold>
  );
}

function RideRow({ booking }: { booking: BookingOut }) {
  const fare = booking.final_fare ?? booking.quoted_fare;
  const date = new Date(booking.created_at);
  const dateLabel = date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  const timeLabel = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const cancelled = CANCELLED_STATUSES.includes(booking.status);
  const meta = VEHICLE_META[booking.vehicle_type];

  return (
    <View style={styles.row}>
      <GlyphTile icon={meta.icon} tone={cancelled ? 'muted' : 'accent'} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowDate}>{dateLabel} · {timeLabel}</Text>
          <Text style={[styles.rowStatus, cancelled && styles.rowStatusCancelled]}>
            {STATUS_LABELS[booking.status]}
          </Text>
        </View>
        <Text style={styles.rowAddress} numberOfLines={1}>
          {booking.pickup_address ?? 'Pickup'} → {booking.drop_address ?? 'Drop'}
        </Text>
        {fare != null ? <Text style={styles.rowFare}>{rupees(fare)}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: space.sm },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  tabActive: { backgroundColor: colors.navy800 },
  tabLabel: { fontFamily: font.semibold, fontSize: 13, color: colors.navy800 },
  tabLabelActive: { color: colors.white },
  row: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  rowBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rowDate: { fontFamily: font.medium, fontSize: 12, color: colors.ink600 },
  rowStatus: { fontFamily: font.bold, fontSize: 12, color: colors.success },
  rowStatusCancelled: { color: colors.danger },
  rowAddress: { fontFamily: font.semibold, fontSize: 14.5, color: colors.navy800 },
  rowFare: { fontFamily: font.bold, fontSize: 15, color: colors.accentDark },
  empty: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink600, textAlign: 'center', marginTop: space.xl },
  errorBox: { padding: space.lg, alignItems: 'center', gap: 4 },
  errorText: { fontFamily: font.regular, fontSize: 14, color: colors.danger, textAlign: 'center' },
  retry: { fontFamily: font.semibold, fontSize: 13, color: colors.accentDark },
});
