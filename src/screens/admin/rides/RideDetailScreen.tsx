import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import Button from '../../../components/Button';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { dateTime, money, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font, space } from '../../../theme';
import type { BookingStatus } from '../../../types';

type Rt = RouteProp<{ RideDetail: { bookingId: string } }, 'RideDetail'>;

const TERMINAL: BookingStatus[] = [
  'completed',
  'cancelled_by_customer',
  'cancelled_by_rider',
  'no_riders_found',
];

const STEPS: { key: string; label: string }[] = [
  { key: 'created_at', label: 'Created' },
  { key: 'assigned_at', label: 'Rider assigned' },
  { key: 'arrived_at', label: 'Arrived at pickup' },
  { key: 'started_at', label: 'Trip started' },
  { key: 'completed_at', label: 'Completed' },
  { key: 'cancelled_at', label: 'Cancelled' },
];

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

export default function RideDetailScreen() {
  const navigation = useNavigation<any>();
  const { bookingId } = useRoute<Rt>().params;

  const fetcher = useCallback(() => adminApi.getBookingDetail(bookingId), [bookingId]);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  const booking = data?.booking as any;
  const canTrack = booking && !TERMINAL.includes(booking.status);

  return (
    <AdminScreen title="Ride Details" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <>
          <SectionCard>
            <View style={styles.head}>
              <Text style={styles.ref}>{booking.reference}</Text>
              <StatusBadge status={booking.status} />
            </View>
            <Field label="Pickup" value={booking.pickup_address} />
            <Field label="Drop" value={booking.drop_address} />
            <Field label="Vehicle" value={titleCase(String(booking.vehicle_type))} />
            <Field label="Payment" value={titleCase(String(booking.payment_method))} />
            <Field
              label="Fare"
              value={money(booking.final_fare ?? booking.quoted_fare ?? 0)}
            />
            {canTrack ? (
              <View style={styles.trackBtn}>
                <Button
                  title="View Live Location"
                  variant="navy"
                  onPress={() =>
                    navigation.navigate('LiveLocation', {
                      bookingId,
                      reference: booking.reference,
                    })
                  }
                />
              </View>
            ) : null}
          </SectionCard>

          <SectionCard title="Timeline" padded={false}>
            {STEPS.filter((s) => data.timeline[s.key as keyof typeof data.timeline]).map((s, idx, arr) => (
              <ListRow
                key={s.key}
                title={s.label}
                subtitle={dateTime(data.timeline[s.key as keyof typeof data.timeline] as string)}
                divider={idx < arr.length - 1}
              />
            ))}
            {data.timeline.cancellation_reason ? (
              <View style={styles.reason}>
                <Text style={styles.reasonText}>Reason: {data.timeline.cancellation_reason}</Text>
              </View>
            ) : null}
          </SectionCard>

          <SectionCard title={`Dispatch offers (${data.offers.length})`} padded={false}>
            {data.offers.length === 0 ? (
              <Text style={[styles.dim, styles.pad]}>No offers recorded.</Text>
            ) : (
              data.offers.map((o, i) => (
                <ListRow
                  key={`${o.rider_id}-${i}`}
                  title={`Rider ${o.rider_id.slice(0, 8)}`}
                  subtitle={`${titleCase(o.outcome)}${o.distance_km != null ? ` · ${o.distance_km} km away` : ''}`}
                  trailing={dateTime(o.offered_at)}
                  divider={i < data.offers.length - 1}
                />
              ))
            )}
          </SectionCard>

          <SectionCard title={`Payments (${data.payments.length})`} padded={false}>
            {data.payments.length === 0 ? (
              <Text style={[styles.dim, styles.pad]}>No payment records.</Text>
            ) : (
              data.payments.map((p, i) => (
                <ListRow
                  key={p.id}
                  title={money(p.amount)}
                  subtitle={titleCase(p.method)}
                  trailing={<StatusBadge status={p.status} />}
                  divider={i < data.payments.length - 1}
                />
              ))
            )}
          </SectionCard>
        </>
      ) : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  ref: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy800 },
  field: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: space.md },
  fieldLabel: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink400 },
  fieldValue: { fontFamily: font.semibold, fontSize: 12.5, color: colors.navy800, flexShrink: 1, textAlign: 'right' },
  trackBtn: { marginTop: space.md },
  dim: { fontFamily: font.regular, fontSize: 13, color: colors.ink400 },
  pad: { padding: space.md },
  reason: { padding: space.md, borderTopWidth: 1, borderTopColor: colors.line100 },
  reasonText: { fontFamily: font.medium, fontSize: 12.5, color: colors.danger },
});
