import React, { useCallback, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import StatGrid from '../../../components/admin/StatGrid';
import StatCard from '../../../components/admin/StatCard';
import ListRow from '../../../components/admin/ListRow';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import BarChart from '../../../components/admin/charts/BarChart';
import Button from '../../../components/Button';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { compactMoney, money, shortDate } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font, space } from '../../../theme';
import type { EarningsStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<EarningsStackParamList, 'EarningsOverview'>;

const RANGES = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
];

export default function EarningsOverviewScreen() {
  const navigation = useNavigation<Nav>();
  const [days, setDays] = useState('30');

  const fetcher = useCallback(
    () => Promise.all([adminApi.getReportsSummary(Number(days)), adminApi.getRevenue(Number(days))]),
    [days]
  );
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Earnings" subtitle="Revenue & payouts" back={false} refreshing={refreshing} onRefresh={onRefresh}>
      <SegmentedTabs options={RANGES} value={days} onChange={setDays} />

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        (() => {
          const [summary, revenue] = data;
          const ordered = [...revenue].reverse();
          return (
            <>
              <StatGrid>
                <StatCard label="Total Revenue" value={compactMoney(summary.gross_revenue)} />
                <StatCard label="Company Commission" value={compactMoney(summary.company_commission)} />
                <StatCard label="Rider Payouts" value={compactMoney(summary.rider_payouts)} />
                <StatCard label="Paid Trips" value={summary.paid_trips} />
              </StatGrid>

              <SectionCard title="Gross vs commission">
                {ordered.length ? (
                  <BarChart
                    data={ordered.flatMap((r) => [
                      { label: shortDate(r.day), value: r.gross, color: colors.accent },
                    ])}
                  />
                ) : (
                  <Text style={styles.dim}>No data.</Text>
                )}
              </SectionCard>

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

              <Button
                title="Revenue report"
                variant="secondary"
                onPress={() => navigation.navigate('RevenueReport')}
              />
              <Button
                title="Rider settlements"
                variant="navy"
                onPress={() => navigation.navigate('Settlements')}
              />
            </>
          );
        })()
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  dim: { fontFamily: font.regular, fontSize: 13, color: colors.ink400 },
  pad: { padding: space.md },
});
