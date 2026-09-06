import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { dateTime, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { space } from '../../../theme';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'role_changed', label: 'Roles' },
  { value: 'pricing_updated', label: 'Pricing' },
  { value: 'settlement_recorded', label: 'Settlements' },
  { value: 'rider_status_changed', label: 'Riders' },
  { value: 'broadcast_sent', label: 'Broadcasts' },
] as const;

export default function RecentActivitiesScreen() {
  const [filter, setFilter] = useState<string>('');
  const fetcher = useCallback(
    () => adminApi.getAuditLogs({ action: filter || undefined, limit: 100 }),
    [filter]
  );
  const { data, loading, error, refreshing, fetching, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Recent Activities" refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.filters}>
        <SegmentedTabs options={FILTERS as any} value={filter} onChange={setFilter} />
      </View>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : fetching && !refreshing ? (
        <LoadingState />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No activity" hint="Actions that change money, roles or pricing are logged here." />
      ) : (
        <SectionCard padded={false}>
          {data.map((l, i) => (
            <ListRow
              key={l.id}
              title={titleCase(l.action)}
              subtitle={`${titleCase(l.entity_type)}${l.actor_role ? ` · ${l.actor_role}` : ''} · ${dateTime(l.created_at)}`}
              divider={i < data.length - 1}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({ filters: { marginBottom: space.xs } });
