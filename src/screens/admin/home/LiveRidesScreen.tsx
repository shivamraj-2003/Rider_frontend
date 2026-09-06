import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import MapCanvas from '../../../components/MapCanvas';
import * as adminApi from '../../../services/admin';
import { colors, radius } from '../../../theme';
import type { HomeStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'LiveRides'>;

export default function LiveRidesScreen() {
  const navigation = useNavigation<Nav>();
  const fetcher = useCallback(() => adminApi.getLiveTrips(), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher, {
    pollMs: 15000,
  });

  const withLoc = data?.filter((t) => t.lat != null && t.lng != null) ?? [];

  return (
    <AdminScreen
      title="Live Rides"
      subtitle={data ? `${data.length} active` : undefined}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={styles.map}>
        <MapCanvas
          pickup={withLoc[0] ? { lat: withLoc[0].lat!, lng: withLoc[0].lng! } : null}
          nearby={withLoc.map((t) => ({ lat: t.lat!, lng: t.lng! }))}
        />
      </View>

      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No rides in progress" hint="Active trips appear here in real time." />
      ) : (
        <SectionCard title="Active trips" padded={false}>
          {data.map((t, i) => (
            <ListRow
              key={t.booking_id}
              title={t.reference}
              subtitle={t.pickup_address ?? 'Pickup —'}
              leading={t.reference.replace(/[^A-Za-z0-9]/g, '').slice(-2)}
              trailing={<StatusBadge status={t.status} />}
              chevron
              divider={i < data.length - 1}
              onPress={() => navigation.navigate('RideDetail', { bookingId: t.booking_id })}
            />
          ))}
        </SectionCard>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 220,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.mapBase,
    borderWidth: 1,
    borderColor: colors.line100,
  },
});
