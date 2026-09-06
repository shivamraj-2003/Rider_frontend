import React, { useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { colors, font, space } from '../../../theme';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Documents'>;

export default function DocumentsScreen() {
  const navigation = useNavigation<Nav>();
  const fetcher = useCallback(
    () => adminApi.getRiders({ status: 'pending_verification', limit: 100 }),
    []
  );
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen
      title="Document Verification"
      subtitle={data ? `${data.length} pending` : undefined}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <Text style={styles.intro}>Riders awaiting document review. Open one to approve or reject.</Text>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Queue is clear" hint="No riders pending verification." />
      ) : (
        <SectionCard padded={false}>
          {data.map((r, i) => (
            <ListRow
              key={r.id}
              leading={r.vehicle_type.slice(0, 2).toUpperCase()}
              title={r.vehicle_number ?? `Rider ${r.id.slice(0, 6)}`}
              subtitle={`${r.vehicle_type} · ${r.total_trips} trips`}
              trailing={<StatusBadge status={r.status} />}
              chevron
              divider={i < data.length - 1}
              onPress={() => navigation.navigate('RiderDocuments', { riderId: r.id })}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink400, marginBottom: space.xs },
});
