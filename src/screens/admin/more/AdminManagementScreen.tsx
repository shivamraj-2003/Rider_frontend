import React, { useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { colors, font } from '../../../theme';

export default function AdminManagementScreen() {
  const fetcher = useCallback(() => adminApi.getUsers({ role: 'admin', limit: 100 }), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Admin Management" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No admins found" />
      ) : (
        <SectionCard title="Administrators" padded={false}>
          {data.map((u, i) => (
            <ListRow
              key={u.id}
              leading={(u.full_name ?? u.phone ?? '?').replace('+', '')}
              title={u.full_name ?? 'Unnamed'}
              subtitle={`${u.phone ?? '—'}${u.email ? ` · ${u.email}` : ''}`}
              trailing={<StatusBadge status={u.is_active ? 'active' : 'inactive'} />}
              divider={i < data.length - 1}
            />
          ))}
        </SectionCard>
      )}

      <Text style={styles.note}>Promote or deactivate admins from the Users tab.</Text>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: font.regular, fontSize: 11.5, color: colors.ink400, textAlign: 'center' },
});
