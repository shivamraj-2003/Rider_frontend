import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import StatGrid from '../../../components/admin/StatGrid';
import StatCard from '../../../components/admin/StatCard';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import LineChart from '../../../components/admin/charts/LineChart';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { compactMoney, money, relativeTime, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font, space } from '../../../theme';
import type { HomeStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();

  const fetcher = useCallback(
    () =>
      Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRevenue(7),
        adminApi.getAuditLogs({ limit: 5 }),
      ]),
    []
  );
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher, {
    pollMs: 60000,
  });

  return (
    <AdminScreen title="Admin Dashboard" subtitle="Business overview" back={false} refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        (() => {
          const [stats, revenue, logs] = data;
          const chartData = [...revenue].reverse().map((r) => r.trips);
          return (
            <>
              <StatGrid>
                <StatCard label="Total Users" value={stats.total_users.toLocaleString('en-IN')} />
                <StatCard label="Total Riders" value={stats.total_riders.toLocaleString('en-IN')} />
                <StatCard label="Active Rides" value={stats.active_bookings} />
                <StatCard label="Completed Rides" value={stats.total_completed.toLocaleString('en-IN')} />
                <StatCard label="Cancelled Rides" value={stats.total_cancelled.toLocaleString('en-IN')} />
                <StatCard label="Riders Online" value={stats.riders_online} />
                <StatCard label="Revenue (Today)" value={compactMoney(stats.revenue_today)} />
                <StatCard label="Commission (Today)" value={compactMoney(stats.commission_today)} />
                <StatCard label="Rider Earnings (Today)" value={compactMoney(stats.rider_earnings_today)} />
                <StatCard
                  label="Safety Alerts"
                  value={stats.open_safety_alerts}
                  deltaTone={stats.open_safety_alerts > 0 ? 'down' : 'up'}
                />
              </StatGrid>

              <SectionCard
                title="Rides Overview · last 7 days"
                action={{ label: 'Analytics', onPress: () => navigation.navigate('Analytics') }}
              >
                {chartData.some((n) => n > 0) ? (
                  <LineChart data={chartData} />
                ) : (
                  <Text style={styles.dim}>No rides in this window yet.</Text>
                )}
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>
                    Gross{'  '}
                    <Text style={styles.legendVal}>
                      {money(revenue.reduce((s, r) => s + r.gross, 0))}
                    </Text>
                  </Text>
                  <Text style={styles.legendItem}>
                    Trips{'  '}
                    <Text style={styles.legendVal}>{revenue.reduce((s, r) => s + r.trips, 0)}</Text>
                  </Text>
                </View>
              </SectionCard>

              <View style={styles.quickRow}>
                <QuickLink label="Live Rides" value={stats.active_trips} onPress={() => navigation.navigate('LiveRides')} />
                <QuickLink
                  label="Pending Riders"
                  value={stats.riders_pending_verification}
                  onPress={() => navigation.navigate('Analytics')}
                />
              </View>

              <SectionCard
                title="Recent Activity"
                action={{ label: 'View all', onPress: () => navigation.navigate('RecentActivities') }}
                padded={false}
              >
                {logs.length === 0 ? (
                  <Text style={[styles.dim, styles.pad]}>Nothing logged yet.</Text>
                ) : (
                  logs.map((l, i) => (
                    <ListRow
                      key={l.id}
                      title={titleCase(l.action)}
                      subtitle={`${titleCase(l.entity_type)}${l.actor_role ? ` · ${l.actor_role}` : ''}`}
                      trailing={relativeTime(l.created_at)}
                      divider={i < logs.length - 1}
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

function QuickLink({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return (
    <View style={styles.quickCard}>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickCta} onPress={onPress}>
        Open →
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { fontFamily: font.regular, fontSize: 13, color: colors.ink400 },
  pad: { padding: space.md },
  legendRow: { flexDirection: 'row', gap: space.lg, marginTop: space.sm },
  legendItem: { fontFamily: font.medium, fontSize: 12, color: colors.ink600 },
  legendVal: { fontFamily: font.bold, color: colors.navy800 },
  quickRow: { flexDirection: 'row', gap: space.sm },
  quickCard: {
    flex: 1,
    backgroundColor: colors.navy800,
    borderRadius: 20,
    padding: space.md,
    gap: 2,
  },
  quickValue: { fontFamily: font.extrabold, fontSize: 24, color: colors.white },
  quickLabel: { fontFamily: font.medium, fontSize: 12, color: colors.line300 },
  quickCta: { fontFamily: font.bold, fontSize: 12, color: colors.accent, marginTop: space.sm },
});
