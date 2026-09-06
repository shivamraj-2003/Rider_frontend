import React, { useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { dateTime, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font } from '../../../theme';

export default function SettingsScreen() {
  const fetcher = useCallback(() => adminApi.getSettings(), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Settings" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No settings" />
      ) : (
        <SectionCard title="App configuration" padded={false}>
          {data.map((s, i) => (
            <ListRow
              key={s.key}
              title={titleCase(s.key)}
              subtitle={s.description ?? JSON.stringify(s.value)}
              trailing={s.is_public ? 'Public' : 'Private'}
              divider={i < data.length - 1}
            />
          ))}
        </SectionCard>
      )}

      {data && data.length > 0 ? (
        <Text style={styles.note}>Last updated {dateTime(data[0].updated_at)}</Text>
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: font.regular, fontSize: 11.5, color: colors.ink400, textAlign: 'center' },
});
