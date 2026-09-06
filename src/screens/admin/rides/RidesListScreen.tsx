import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { shortDate } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { space } from '../../../theme';
import type { BookingStatus } from '../../../types';
import type { RidesStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<RidesStackParamList, 'RidesList'>;

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ACTIVE: BookingStatus[] = ['requested', 'assigned', 'arrived', 'in_progress'];
const CANCELLED: BookingStatus[] = ['cancelled_by_customer', 'cancelled_by_rider', 'no_riders_found'];

export default function RidesListScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState('all');

  const fetcher = useCallback(async () => {
    if (tab === 'completed') return adminApi.getBookings({ status: 'completed', limit: 100 });
    const rows = await adminApi.getBookings({ limit: 200 });
    if (tab === 'active') return rows.filter((b) => ACTIVE.includes(b.status));
    if (tab === 'cancelled') return rows.filter((b) => CANCELLED.includes(b.status));
    return rows;
  }, [tab]);

  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Rides" back={false} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.filters}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      </View>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No rides" />
      ) : (
        <SectionCard padded={false}>
          {data.map((b, i) => (
            <ListRow
              key={b.id}
              leading={b.reference.replace(/[^A-Za-z0-9]/g, '').slice(-2)}
              title={b.reference}
              subtitle={`${shortDate(b.created_at)} · ${b.pickup_address ?? 'Pickup —'}`}
              trailing={
                <View style={styles.trail}>
                  <StatusBadge status={b.status} />
                </View>
              }
              chevron
              divider={i < data.length - 1}
              onPress={() => navigation.navigate('RideDetail', { bookingId: b.id })}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: space.xs },
  trail: { alignItems: 'flex-end', gap: 2 },
});
