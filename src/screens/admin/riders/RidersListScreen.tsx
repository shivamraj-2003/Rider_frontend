import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { space } from '../../../theme';
import type { RiderStatus, VehicleType } from '../../../types';
import type { RidersStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<RidersStackParamList, 'RidersList'>;
type Rt = RouteProp<RidersStackParamList, 'RidersList'>;

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'pending_verification', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'rejected', label: 'Rejected' },
];

const VEHICLE_LABEL: Record<VehicleType, string> = { bike: 'Bike', auto: 'Auto', car: 'Car' };

export default function RidersListScreen() {
  const navigation = useNavigation<Nav>();
  const initial = useRoute<Rt>().params?.initialStatus ?? 'all';
  const [status, setStatus] = useState(initial);

  const fetcher = useCallback(
    () =>
      adminApi.getRiders({
        status: status === 'all' ? undefined : (status as RiderStatus),
        limit: 100,
      }),
    [status]
  );
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Riders" back={false} refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.filters}>
        <SegmentedTabs options={STATUSES} value={status} onChange={setStatus} />
      </View>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No riders" />
      ) : (
        <SectionCard padded={false}>
          {data.map((r, i) => (
            <ListRow
              key={r.id}
              leading={VEHICLE_LABEL[r.vehicle_type]?.slice(0, 2) ?? 'RD'}
              title={r.vehicle_number ?? `Rider ${r.id.slice(0, 6)}`}
              subtitle={`${VEHICLE_LABEL[r.vehicle_type] ?? r.vehicle_type} · ${r.total_trips} trips${r.rating != null ? ` · ★ ${r.rating}` : ''}`}
              trailing={<StatusBadge status={r.status} />}
              chevron
              divider={i < data.length - 1}
              onPress={() => navigation.navigate('RiderDetail', { riderId: r.id })}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({ filters: { marginBottom: space.xs } });
