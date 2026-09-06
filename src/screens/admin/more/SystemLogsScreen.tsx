import React, { useCallback } from 'react';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { dateTime, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';

export default function SystemLogsScreen() {
  const fetcher = useCallback(() => adminApi.getAuditLogs({ limit: 100 }), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="System Logs" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No audit logs" />
      ) : (
        <SectionCard padded={false}>
          {data.map((log, i) => (
            <ListRow
              key={log.id}
              title={titleCase(log.action)}
              subtitle={`${titleCase(log.entity_type)}${log.actor_role ? ` · ${titleCase(log.actor_role)}` : ''} · ${dateTime(log.created_at)}`}
              divider={i < data.length - 1}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}
