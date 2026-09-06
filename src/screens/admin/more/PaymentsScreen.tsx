import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { space } from '../../../theme';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'pending', label: 'Pending' },
];

export default function PaymentsScreen() {
  const [tab, setTab] = useState('all');
  const fetcher = useCallback(
    () => adminApi.getPayments({ status: tab === 'all' ? undefined : tab, limit: 100 }),
    [tab]
  );
  const { data, loading, error, refreshing, fetching, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Payments" refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.filters}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      </View>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : fetching && !refreshing ? (
        <LoadingState />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No payments" />
      ) : (
        <SectionCard padded={false}>
          {data.map((p, i) => (
            <ListRow
              key={p.id}
              title={money(p.amount)}
              subtitle={`${p.reference} · ${p.customer_name ?? '—'} · ${titleCase(p.method)}`}
              trailing={<StatusBadge status={p.status} />}
              divider={i < data.length - 1}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({ filters: { marginBottom: space.xs } });
