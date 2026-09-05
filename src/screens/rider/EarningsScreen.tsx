import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import { getEarningsLedger, getEarningsSummary, getRiderStats } from '../../services/rider';
import { colors, spacing, typography } from '../../theme';
import type { EarningsEntry, EarningsSummary, RiderStats } from '../../types';

// Maps to Agreement section 3: rider earnings calculation, company commission calculation.
export default function EarningsScreen() {
  const [stats, setStats] = useState<RiderStats | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [ledger, setLedger] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRiderStats(), getEarningsSummary(), getEarningsLedger()])
      .then(([s, sum, led]) => {
        setStats(s);
        setSummary(sum);
        setLedger(led);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ScreenScaffold title="Earnings">
        <ActivityIndicator color={colors.primary} />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Earnings">
      <View style={styles.grid}>
        {[
          ['Today', `₹${(summary?.today ?? 0).toFixed(0)}`],
          ['This Week', `₹${(summary?.this_week ?? 0).toFixed(0)}`],
          ['This Month', `₹${(summary?.this_month ?? 0).toFixed(0)}`],
          ['Lifetime', `₹${(summary?.lifetime ?? 0).toFixed(0)}`],
          ['Pending Settlement', `₹${(summary?.pending_settlement ?? 0).toFixed(0)}`],
          ['Trips Today', String(stats?.trips_today ?? 0)],
          ['Total Trips', String(stats?.total_trips ?? 0)],
          ['Rating', stats?.rating != null ? stats.rating.toFixed(1) : '—'],
        ].map(([label, value]) => (
          <View key={label} style={styles.gridItem}>
            <InfoCard label={label} value={value} />
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent trips</Text>
      <FlatList
        data={ledger}
        keyExtractor={(item) => item.booking_id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowFare}>₹{item.net_earning.toFixed(0)}</Text>
            <Text style={styles.rowMeta}>
              gross ₹{item.gross_fare.toFixed(0)} · commission ₹{item.commission.toFixed(0)} · {item.settlement_status}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No trips yet.</Text>}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '47%' },
  sectionTitle: { ...typography.bodyStrong, color: colors.textPrimary, marginTop: spacing.md },
  row: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowFare: { ...typography.bodyStrong, color: colors.primary },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.caption, color: colors.textSecondary },
});
