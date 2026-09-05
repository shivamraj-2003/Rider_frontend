import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { useAppConfig } from '../../context/AppConfigContext';
import { getFareEstimates } from '../../services/customer';
import { ApiError } from '../../services/api';
import { colors, font, radius, shadow } from '../../theme';
import { Sheet, VehicleRow } from '../../components/booking';
import Button from '../../components/Button';
import MapCanvas from '../../components/MapCanvas';
import { VEHICLE_META, rupees } from '../../types';
import type { FareEstimate, VehicleType } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'RideSelect'>;

// 09 · RideSelect. One POST /bookings/estimates → a row per vehicle type.
// Only the types /config returns are shown, in that order. Fares are estimates.
export default function RideSelectScreen({ navigation, route }: Props) {
  const { pickup, drop } = route.params;
  const { config } = useAppConfig();

  const [estimates, setEstimates] = useState<FareEstimate[] | null>(null);
  const [selected, setSelected] = useState<VehicleType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setEstimates(null);
    try {
      const rows = await getFareEstimates({
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        vehicle_type: 'bike', // a single call returns every vehicle type
      });
      const allowed = (config?.vehicle_types ?? rows.map((r) => r.vehicle_type))
        .map((vt) => rows.find((r) => r.vehicle_type === vt))
        .filter((r): r is FareEstimate => !!r);
      setEstimates(allowed);
      setSelected(allowed[0]?.vehicle_type ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not price this trip.');
    }
  }, [pickup, drop, config?.vehicle_types]);

  useEffect(() => {
    load();
  }, [load]);

  const insets = useSafeAreaInsets();
  const chosen = estimates?.find((e) => e.vehicle_type === selected) ?? null;
  const fastest =
    estimates && estimates.length > 1
      ? estimates.reduce((a, b) => (b.duration_min < a.duration_min ? b : a))
      : null;

  return (
    <View style={styles.root}>
      <MapCanvas center={pickup} pickup={pickup} drop={drop} />

      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.back, { top: insets.top + 8 }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <IconArrowLeft size={20} color={colors.navy800} strokeWidth={2} />
      </Pressable>

      <View style={styles.sheetWrap}>
        <Sheet>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Choose a ride</Text>
            {chosen ? (
              <Text style={styles.meta}>
                {chosen.distance_km.toFixed(1)} km · {chosen.duration_min} min
              </Text>
            ) : null}
          </View>

          {error ? (
            <Pressable onPress={load} style={styles.errorBox} accessibilityRole="button">
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.retry}>Tap to retry</Text>
            </Pressable>
          ) : !estimates ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View style={styles.rows}>
              {estimates.map((e) => {
                const meta = VEHICLE_META[e.vehicle_type];
                const surge = e.surge_multiplier > 1;
                const isFastest = fastest?.vehicle_type === e.vehicle_type;
                return (
                  <VehicleRow
                    key={e.vehicle_type}
                    label={meta.label}
                    icon={meta.icon}
                    meta={`${e.duration_min} min · ${meta.seats}`}
                    fare={e.fare}
                    badge={
                      surge
                        ? { label: `${e.surge_multiplier}× SURGE`, variant: 'outline' }
                        : isFastest
                          ? { label: 'FASTEST' }
                          : undefined
                    }
                    selected={selected === e.vehicle_type}
                    onPress={() => setSelected(e.vehicle_type)}
                  />
                );
              })}
            </View>
          )}

          <Text style={styles.disclaimer}>
            Estimated fare. The final amount is calculated from the distance actually travelled.
          </Text>

          <Button
            title={chosen ? `Continue · ${rupees(chosen.fare)}` : 'Continue'}
            disabled={!chosen}
            onPress={() => {
              if (chosen) navigation.navigate('Payment', { pickup, drop, estimate: chosen });
            }}
          />
        </Sheet>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBase },
  back: {
    position: 'absolute',
    left: 20,
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sheetWrap: { marginTop: 'auto' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.extrabold, fontSize: 20, letterSpacing: -0.4, color: colors.navy800 },
  meta: { fontFamily: font.medium, fontSize: 12, color: colors.ink400, fontVariant: ['tabular-nums'] },
  loading: { paddingVertical: 40 },
  rows: { gap: 10 },
  disclaimer: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.ink400 },
  errorBox: { backgroundColor: colors.surface50, borderRadius: radius.control, padding: 18, gap: 6 },
  errorText: { fontFamily: font.semibold, fontSize: 14, color: colors.navy800 },
  retry: { fontFamily: font.medium, fontSize: 13, color: colors.accentDark },
});
