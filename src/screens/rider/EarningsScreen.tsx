import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { IconCoin } from '@tabler/icons-react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import GradientCard from '../../components/GradientCard';
import { getEarningsLedger, getEarningsSummary, getRiderStats } from '../../services/rider';
import { colors, font, radius, shadow, space } from '../../theme';
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
        <ActivityIndicator color={colors.accentDark} />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Earnings">
      <GradientCard style={styles.hero}>
        <View style={styles.heroIcon}>
          <IconCoin size={22} color={colors.accent} strokeWidth={1.75} />
        </View>
        <Text style={styles.heroLabel}>Today's earnings</Text>
        <Text style={styles.heroValue}>₹{(summary?.today ?? 0).toFixed(0)}</Text>
        <Text style={styles.heroSub}>{stats?.trips_today ?? 0} trips today</Text>
      </GradientCard>

      <View style={styles.grid}>
        {[
          ['This Week', `₹${(summary?.this_week ?? 0).toFixed(0)}`],
          ['This Month', `₹${(summary?.this_month ?? 0).toFixed(0)}`],
          ['Lifetime', `₹${(summary?.lifetime ?? 0).toFixed(0)}`],
          ['Pending Settlement', `₹${(summary?.pending_settlement ?? 0).toFixed(0)}`],
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
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
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
  hero: {
    padding: space.xl,
    alignItems: 'center',
    gap: 4,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    backgroundColor: 'rgba(232,121,43,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroLabel: { fontFamily: font.medium, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  heroValue: { fontFamily: font.extrabold, fontSize: 34, color: colors.white, letterSpacing: -0.5 },
  heroSub: { fontFamily: font.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.65)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  gridItem: { width: '47%' },
  sectionTitle: { fontFamily: font.bold, fontSize: 15, color: colors.navy800, marginTop: space.sm },
  row: {
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    gap: 2,
    ...shadow.card,
  },
  rowFare: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy800 },
  rowMeta: { fontFamily: font.regular, fontSize: 12, color: colors.ink600 },
  empty: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink600 },
});
