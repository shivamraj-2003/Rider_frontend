import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money, shortDate } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font, space } from '../../../theme';

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

export default function RevenueReportScreen() {
  const [days, setDays] = useState('30');
  const fetcher = useCallback(() => adminApi.getRevenue(Number(days)), [days]);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  const totals = data?.reduce(
    (acc, r) => ({
      trips: acc.trips + r.trips,
      gross: acc.gross + r.gross,
      commission: acc.commission + r.commission,
      payouts: acc.payouts + r.rider_payouts,
    }),
    { trips: 0, gross: 0, commission: 0, payouts: 0 }
  );

  return (
    <AdminScreen title="Revenue Report" refreshing={refreshing} onRefresh={onRefresh}>
      <SegmentedTabs options={RANGES} value={days} onChange={setDays} />

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No revenue in this window" />
      ) : (
        <>
          {totals ? (
            <SectionCard title={`Totals · ${days} days`}>
              <Row label="Trips" value={String(totals.trips)} />
              <Row label="Gross" value={money(totals.gross)} />
              <Row label="Company commission" value={money(totals.commission)} />
              <Row label="Rider payouts" value={money(totals.payouts)} />
            </SectionCard>
          ) : null}

          <SectionCard title="By day" padded={false}>
            <View style={[styles.tr, styles.thead]}>
              <Text style={[styles.th, styles.day]}>Day</Text>
              <Text style={styles.th}>Trips</Text>
              <Text style={styles.th}>Gross</Text>
              <Text style={styles.th}>Comm.</Text>
            </View>
            {data.map((r) => (
              <View key={r.day} style={styles.tr}>
                <Text style={[styles.td, styles.day]}>{shortDate(r.day)}</Text>
                <Text style={styles.td}>{r.trips}</Text>
                <Text style={styles.td}>{money(r.gross)}</Text>
                <Text style={styles.td}>{money(r.commission)}</Text>
              </View>
            ))}
          </SectionCard>
        </>
      )}
    </AdminScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink400 },
  summaryValue: { fontFamily: font.bold, fontSize: 12.5, color: colors.navy800 },
  tr: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line100,
  },
  thead: { backgroundColor: colors.surface50 },
  th: { flex: 1, fontFamily: font.bold, fontSize: 10.5, color: colors.ink400, textAlign: 'right' },
  td: { flex: 1, fontFamily: font.semibold, fontSize: 11.5, color: colors.navy800, textAlign: 'right' },
  day: { flex: 1.2, textAlign: 'left' },
});
