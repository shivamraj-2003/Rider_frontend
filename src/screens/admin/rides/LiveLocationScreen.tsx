import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import StatusBadge from '../../../components/admin/StatusBadge';
import MapCanvas from '../../../components/MapCanvas';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { colors, font, radius, space } from '../../../theme';

type Rt = RouteProp<{ LiveLocation: { bookingId: string; reference?: string } }, 'LiveLocation'>;

export default function LiveLocationScreen() {
  const { bookingId, reference } = useRoute<Rt>().params;
  const fetcher = useCallback(() => adminApi.getLiveTrips(), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher, {
    pollMs: 10000,
  });

  const trip = data?.find((t) => t.booking_id === bookingId);

  return (
    <AdminScreen title="Live Location" subtitle={reference} refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !trip ? (
        <EmptyState title="Trip is no longer live" hint="It may have completed or been cancelled." />
      ) : (
        <>
          <View style={styles.map}>
            <MapCanvas
              pickup={trip.lat != null && trip.lng != null ? { lat: trip.lat, lng: trip.lng } : null}
              riderLocation={trip.lat != null && trip.lng != null ? { lat: trip.lat, lng: trip.lng } : null}
            />
          </View>
          <SectionCard>
            <View style={styles.row}>
              <Text style={styles.ref}>{trip.reference}</Text>
              <StatusBadge status={trip.status} />
            </View>
            <Text style={styles.meta}>Pickup: {trip.pickup_address ?? '—'}</Text>
            <Text style={styles.meta}>Drop: {trip.drop_address ?? '—'}</Text>
            <Text style={styles.meta}>
              Rider position:{' '}
              {trip.lat != null ? `${trip.lat.toFixed(5)}, ${trip.lng?.toFixed(5)}` : 'not reporting'}
            </Text>
          </SectionCard>
          <Text style={styles.note}>Updates every 10 seconds while this screen is open.</Text>
        </>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line100,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  ref: { fontFamily: font.extrabold, fontSize: 16, color: colors.navy800 },
  meta: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600, marginTop: 3 },
  note: { fontFamily: font.regular, fontSize: 11.5, color: colors.ink400, textAlign: 'center' },
});
