import React, { useCallback, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { dateTime, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { colors, font, space } from '../../../theme';

const TABS = [
  { value: 'reports', label: 'User Reports' },
  { value: 'alerts', label: 'Safety Alerts' },
];

export default function SupportScreen() {
  const [tab, setTab] = useState('reports');

  const reportsFetcher = useCallback(() => adminApi.getUserReports(), []);
  const reports = useAdminQuery(reportsFetcher);

  const alertsFetcher = useCallback(() => adminApi.getSafetyAlerts(true), []);
  const alerts = useAdminQuery(alertsFetcher);

  const active = tab === 'reports' ? reports : alerts;

  const resolve = (id: string) => {
    Alert.alert('Resolve report', 'Choose an outcome', [
      { text: 'Cancel', style: 'cancel' },
      ...['reviewing', 'actioned', 'dismissed'].map((r) => ({
        text: titleCase(r),
        onPress: async () => {
          try {
            await adminApi.resolveUserReport(id, r);
            await reports.refetch();
          } catch (e) {
            Alert.alert('Failed', e instanceof ApiError ? e.message : 'Try again.');
          }
        },
      })),
    ]);
  };

  return (
    <AdminScreen title="Support / Helpdesk" refreshing={active.refreshing} onRefresh={active.onRefresh}>
      <View style={styles.filters}>
        <SegmentedTabs options={TABS} value={tab} onChange={setTab} />
      </View>

      {active.loading && !active.data ? (
        <LoadingState />
      ) : active.error && !active.data ? (
        <ErrorState message={active.error} onRetry={active.refetch} />
      ) : tab === 'reports' ? (
        !reports.data || reports.data.length === 0 ? (
          <EmptyState title="No user reports" />
        ) : (
          <SectionCard padded={false}>
            {reports.data.map((r, i, arr) => (
              <ListRow
                key={r.id}
                title={titleCase(r.reason)}
                subtitle={`${r.details ?? 'No details'} · ${dateTime(r.created_at)}`}
                trailing={<StatusBadge status={r.status} />}
                divider={i < arr.length - 1}
                onPress={() => resolve(r.id)}
              />
            ))}
          </SectionCard>
        )
      ) : !alerts.data || alerts.data.length === 0 ? (
        <EmptyState title="No open safety alerts" />
      ) : (
        <SectionCard padded={false}>
          {alerts.data.map((a, i, arr) => (
            <ListRow
              key={a.id}
              title={titleCase(a.alert_type)}
              subtitle={dateTime(a.created_at)}
              trailing={<StatusBadge status={a.resolution_status} />}
              divider={i < arr.length - 1}
            />
          ))}
        </SectionCard>
      )}

      <Text style={styles.note}>Tap a user report to set its outcome.</Text>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: space.xs },
  note: { fontFamily: font.regular, fontSize: 11.5, color: colors.ink400, textAlign: 'center' },
});
