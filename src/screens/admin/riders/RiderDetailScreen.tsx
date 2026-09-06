import React, { useCallback, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import StatGrid from '../../../components/admin/StatGrid';
import StatCard from '../../../components/admin/StatCard';
import StatusBadge from '../../../components/admin/StatusBadge';
import Button from '../../../components/Button';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { colors, font, space } from '../../../theme';
import type { RiderStatus } from '../../../types';
import type { RidersStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<RidersStackParamList, 'RiderDetail'>;
type Rt = RouteProp<RidersStackParamList, 'RiderDetail'>;

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

export default function RiderDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { riderId } = useRoute<Rt>().params;
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback(() => adminApi.getRiderDetail(riderId), [riderId]);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  const setStatus = (next: RiderStatus, verb: string) => {
    Alert.alert(`${verb} rider?`, `This sets the rider to "${next}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: verb,
        style: next === 'approved' ? 'default' : 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await adminApi.setRiderStatus(riderId, next);
            await refetch();
          } catch (e) {
            Alert.alert('Failed', e instanceof ApiError ? e.message : 'Try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <AdminScreen title="Rider Details" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <>
          <SectionCard>
            <View style={styles.head}>
              <View style={styles.headText}>
                <Text style={styles.name}>{data.user?.full_name ?? 'Rider'}</Text>
                <Text style={styles.meta}>{data.user?.phone ?? '—'}</Text>
              </View>
              <StatusBadge status={data.rider.status as string} />
            </View>
            <View style={styles.badgeRow}>
              <StatusBadge status={data.rider.availability as string} />
              {data.rating != null ? (
                <Text style={styles.rating}>★ {data.rating}</Text>
              ) : null}
            </View>
          </SectionCard>

          <StatGrid>
            <StatCard label="Total Trips" value={data.total_trips} />
            <StatCard label="Cancelled" value={data.cancelled_trips} />
            <StatCard label="Lifetime Earnings" value={money(data.lifetime_earnings)} />
            <StatCard label="Lifetime Commission" value={money(data.lifetime_commission)} />
          </StatGrid>

          <SectionCard title="Vehicle">
            <Field label="Type" value={data.vehicle.vehicle_type} />
            <Field label="Number" value={data.vehicle.vehicle_number} />
            <Field label="Model" value={data.vehicle.vehicle_model} />
            <Field label="Licence number" value={data.vehicle.licence_number} />
          </SectionCard>

          <SectionCard title="Bank / payout">
            <Field label="Account holder" value={data.bank.account_holder} />
            <Field label="Account number" value={data.bank.account_number} />
            <Field label="IFSC" value={data.bank.ifsc} />
          </SectionCard>

          <SectionCard
            title="Documents"
            action={{
              label: 'Review',
              onPress: () =>
                navigation.navigate('RiderDocuments', {
                  riderId,
                  riderName: data.user?.full_name ?? undefined,
                }),
            }}
          >
            <Field label="Licence uploaded" value={data.documents_uploaded.licence ? 'Yes' : 'No'} />
            <Field label="RC uploaded" value={data.documents_uploaded.rc ? 'Yes' : 'No'} />
          </SectionCard>

          <View style={styles.actions}>
            {data.rider.status !== 'approved' ? (
              <Button title="Approve" variant="navy" loading={busy} onPress={() => setStatus('approved', 'Approve')} />
            ) : null}
            <View style={styles.actionRow}>
              <View style={styles.flex}>
                <Button title="Suspend" variant="secondary" loading={busy} onPress={() => setStatus('suspended', 'Suspend')} />
              </View>
              <View style={styles.flex}>
                <Button title="Reject" variant="primary" loading={busy} onPress={() => setStatus('rejected', 'Reject')} />
              </View>
            </View>
          </View>
        </>
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headText: { flex: 1 },
  name: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy800 },
  meta: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600, marginTop: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  rating: { fontFamily: font.bold, fontSize: 12, color: colors.accentDark },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: space.md,
  },
  fieldLabel: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink400 },
  fieldValue: { fontFamily: font.semibold, fontSize: 12.5, color: colors.navy800, flexShrink: 1, textAlign: 'right' },
  actions: { gap: space.sm, marginTop: space.xs },
  actionRow: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
