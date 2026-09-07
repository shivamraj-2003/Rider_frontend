import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenScaffold from '../../../components/ScreenScaffold';
import { Badge } from '../../../components/booking';
import { getSubscriptionHistory } from '../../../services/subscriptions';
import { ApiError } from '../../../services/api';
import { colors, font, radius, shadow, space } from '../../../theme';
import { VEHICLE_META, rupees } from '../../../types';
import type { Subscription } from '../../../types';

const STATUS_VARIANT: Record<string, 'accent' | 'outline'> = {
  active: 'accent',
  paused: 'outline',
  expired: 'outline',
  cancelled: 'outline',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SubscriptionHistoryScreen() {
  const [rows, setRows] = useState<Subscription[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    getSubscriptionHistory()
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your history'));
  }, []);

  useEffect(load, [load]);

  return (
    <ScreenScaffold title="Subscription History">
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : rows === null ? (
        <ActivityIndicator color={colors.accentDark} style={{ marginTop: space.xxl }} />
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>You haven't had a commute subscription yet.</Text>
      ) : (
        rows.map((sub) => {
          const meta = VEHICLE_META[sub.vehicle_type];
          return (
            <View key={sub.id} style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.name}>{sub.plan_name}</Text>
                <Badge label={sub.status.toUpperCase()} variant={STATUS_VARIANT[sub.status] ?? 'outline'} />
              </View>
              <Text style={styles.sub}>
                {meta.label} · {sub.home_address} → {sub.office_address}
              </Text>
              <View style={styles.row}>
                <Text style={styles.meta}>{fmtDate(sub.start_date)} – {fmtDate(sub.end_date)}</Text>
                <Text style={styles.meta}>{sub.used_rides}/{sub.total_rides} rides used</Text>
              </View>
              <Text style={styles.price}>{rupees(sub.monthly_price)}/month</Text>
            </View>
          );
        })
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.ink400, textAlign: 'center', marginTop: space.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.md, gap: 6, borderWidth: 1, borderColor: colors.line100, ...shadow.card },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: font.extrabold, fontSize: 14.5, color: colors.navy800 },
  sub: { fontFamily: font.regular, fontSize: 12, color: colors.ink600 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: font.medium, fontSize: 11.5, color: colors.ink400 },
  price: { fontFamily: font.extrabold, fontSize: 15, color: colors.navy800, marginTop: 2 },
});
