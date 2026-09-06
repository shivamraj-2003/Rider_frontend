import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import StatGrid from '../../../components/admin/StatGrid';
import StatCard from '../../../components/admin/StatCard';
import ListRow from '../../../components/admin/ListRow';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import BarChart from '../../../components/admin/charts/BarChart';
import DonutChart, { Slice } from '../../../components/admin/charts/DonutChart';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { compactMoney, money, shortDate, statusColor } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font } from '../../../theme';

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

export default function AnalyticsScreen() {
  const [days, setDays] = useState('30');
  const fetcher = useCallback(
    () => Promise.all([adminApi.getReportsSummary(Number(days)), adminApi.getRevenue(Number(days))]),
    [days]
  );
  const { data, loading, error, refreshing, fetching, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Analytics" refreshing={refreshing} onRefresh={onRefresh}>
      <SegmentedTabs options={RANGES} value={days} onChange={setDays} />

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : fetching && !refreshing ? (
        <LoadingState />
      ) : data ? (
        (() => {
          const [summary, revenue] = data;
          const ordered = [...revenue].reverse();
          const slices: Slice[] = Object.entries(summary.rides_by_status).map(([k, v]) => ({
            label: k.replace(/_/g, ' '),
            value: Number(v),
            color: statusColor(k),
          }));
          return (
            <>
              <StatGrid>
                <StatCard label="Gross Revenue" value={compactMoney(summary.gross_revenue)} />
                <StatCard label="Company Commission" value={compactMoney(summary.company_commission)} />
                <StatCard label="Rider Payouts" value={compactMoney(summary.rider_payouts)} />
                <StatCard label="Total Rides" value={summary.total_rides} />
                <StatCard
                  label="Completion Rate"
                  value={summary.completion_rate != null ? `${summary.completion_rate}%` : '—'}
                />
                <StatCard
                  label="Average Fare"
                  value={summary.average_fare != null ? money(summary.average_fare) : '—'}
                />
              </StatGrid>

              <SectionCard title="Revenue by day">
                {ordered.length ? (
                  <BarChart data={ordered.map((r) => ({ label: shortDate(r.day), value: r.gross }))} />
                ) : (
                  <Text style={styles.dim}>No data in this window.</Text>
                )}
              </SectionCard>

              {slices.length ? (
                <SectionCard title="Rides by status">
                  <DonutChart slices={slices} centerLabel="rides" />
                </SectionCard>
              ) : null}

              <SectionCard title="Top riders by earnings" padded={false}>
                {summary.top_riders.length === 0 ? (
                  <Text style={[styles.dim, styles.pad]}>No paid trips yet.</Text>
                ) : (
                  summary.top_riders.map((r, i) => (
                    <ListRow
                      key={r.rider_id}
                      leading={`#${i + 1}`}
                      title={`Rider ${r.rider_id.slice(0, 8)}`}
                      subtitle={`${r.trips} trips`}
                      trailing={money(r.earnings)}
                      divider={i < summary.top_riders.length - 1}
                    />
                  ))
                )}
              </SectionCard>
            </>
          );
        })()
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  dim: { fontFamily: font.regular, fontSize: 13, color: colors.ink400 },
  pad: { padding: 14 },
});
