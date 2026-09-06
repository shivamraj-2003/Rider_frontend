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
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { compactMoney, money, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font } from '../../../theme';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Reports'>;

const RANGES = [
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
];

export default function ReportsScreen() {
  const navigation = useNavigation<Nav>();
  const [days, setDays] = useState('30');
  const fetcher = useCallback(() => adminApi.getReportsSummary(Number(days)), [days]);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Reports" refreshing={refreshing} onRefresh={onRefresh}>
      <SegmentedTabs options={RANGES} value={days} onChange={setDays} />

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <>
          <StatGrid>
            <StatCard label="Total Rides" value={data.total_rides} />
            <StatCard label="Completion Rate" value={data.completion_rate != null ? `${data.completion_rate}%` : '—'} />
            <StatCard label="Gross Revenue" value={compactMoney(data.gross_revenue)} />
            <StatCard label="Company Commission" value={compactMoney(data.company_commission)} />
            <StatCard label="Rider Payouts" value={compactMoney(data.rider_payouts)} />
            <StatCard label="Average Fare" value={data.average_fare != null ? money(data.average_fare) : '—'} />
          </StatGrid>

          <SectionCard title="Rides by status" padded={false}>
            {Object.entries(data.rides_by_status).map(([k, v], i, arr) => (
              <ListRow key={k} title={titleCase(k)} trailing={String(v)} divider={i < arr.length - 1} />
            ))}
          </SectionCard>

          <SectionCard title="Detailed reports" padded={false}>
            <ListRow title="Revenue Report" chevron onPress={() => navigation.getParent()?.navigate('EarningsTab' as never)} />
            <ListRow title="Support / User Reports" chevron divider={false} onPress={() => navigation.navigate('Support')} />
          </SectionCard>

          <Text style={styles.note}>Period: last {data.period_days} days · {data.paid_trips} paid trips</Text>
        </>
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: font.regular, fontSize: 11.5, color: colors.ink400, textAlign: 'center' },
});
