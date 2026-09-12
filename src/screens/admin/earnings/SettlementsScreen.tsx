import React, { useCallback, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import Button from '../../../components/Button';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money, relativeTime } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { useAppConfig } from '../../../context/AppConfigContext';
import { colors, font, space } from '../../../theme';

export default function SettlementsScreen() {
  const { config } = useAppConfig();
  const [busyId, setBusyId] = useState<string | null>(null);
  const fetcher = useCallback(() => adminApi.getPendingSettlements(), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  const totalDue = data?.reduce((s, r) => s + r.amount_due, 0) ?? 0;

  const settle = (riderId: string, amount: number) => {
    Alert.alert('Settle rider?', `Mark ${money(amount)} as paid out. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settle',
        onPress: async () => {
          setBusyId(riderId);
          try {
            const res = await adminApi.settleRider(riderId);
            Alert.alert('Settled', `${res.entries_settled} entries · ${money(res.amount_settled)}`);
            await refetch();
          } catch (e) {
            Alert.alert('Failed', e instanceof ApiError ? e.message : 'Try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const payout = (riderId: string, amount: number) => {
    Alert.alert(
      'Pay via Razorpay?',
      `Send ${money(amount)} to this rider's bank account now. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay now',
          onPress: async () => {
            setBusyId(riderId);
            try {
              const res = await adminApi.payoutRider(riderId);
              Alert.alert('Payout started', `${money(res.amount)} · status: ${res.status}`);
              await refetch();
            } catch (e) {
              Alert.alert('Payout failed', e instanceof ApiError ? e.message : 'Try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <AdminScreen title="Rider Settlements" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="All settled" hint="No pending rider payouts." />
      ) : (
        <>
          <SectionCard>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total pending</Text>
              <Text style={styles.totalValue}>{money(totalDue)}</Text>
            </View>
          </SectionCard>

          <SectionCard padded={false}>
            {data.map((r, i) => (
              <View key={r.rider_id} style={[styles.item, i < data.length - 1 && styles.divider]}>
                <ListRow
                  title={`Rider ${r.rider_id.slice(0, 8)}`}
                  subtitle={`${r.pending_entries} trips · last ${relativeTime(r.last_trip_at)}`}
                  trailing={money(r.amount_due)}
                  divider={false}
                />
                <View style={[styles.btn, styles.btnRow]}>
                  {config?.payouts_enabled ? (
                    <View style={styles.btnFlex}>
                      <Button
                        title="Pay via Razorpay"
                        variant="navy"
                        loading={busyId === r.rider_id}
                        onPress={() => payout(r.rider_id, r.amount_due)}
                      />
                    </View>
                  ) : null}
                  <View style={styles.btnFlex}>
                    <Button
                      title={config?.payouts_enabled ? 'Mark settled' : 'Settle now'}
                      variant={config?.payouts_enabled ? 'secondary' : 'navy'}
                      loading={busyId === r.rider_id}
                      onPress={() => settle(r.rider_id, r.amount_due)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </SectionCard>
        </>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: font.medium, fontSize: 13, color: colors.ink400 },
  totalValue: { fontFamily: font.extrabold, fontSize: 20, color: colors.navy800 },
  item: { paddingBottom: space.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line100 },
  btn: { paddingHorizontal: space.md },
  btnRow: { flexDirection: 'row', gap: space.sm },
  btnFlex: { flex: 1 },
});
