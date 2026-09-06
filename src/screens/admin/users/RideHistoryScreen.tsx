import React, { useCallback } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { shortDate } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import type { UsersStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<UsersStackParamList, 'RideHistory'>;
type Rt = RouteProp<UsersStackParamList, 'RideHistory'>;

export default function RideHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { phone, name } = useRoute<Rt>().params;

  const fetcher = useCallback(
    () => (phone ? adminApi.searchRides(phone, 50) : Promise.resolve([])),
    [phone]
  );
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Ride History" subtitle={name} refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No rides yet" />
      ) : (
        <SectionCard padded={false}>
          {data.map((r, i) => (
            <ListRow
              key={r.booking_id}
              title={r.reference}
              subtitle={shortDate(r.created_at)}
              trailing={<StatusBadge status={r.status} />}
              chevron
              divider={i < data.length - 1}
              onPress={() => navigation.navigate('RideDetail', { bookingId: r.booking_id })}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}
