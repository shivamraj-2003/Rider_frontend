import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { colors, font, space, radius } from '../../../theme';
import { VEHICLE_META } from '../../../types';
import type { VehicleType } from '../../../types';
import type { PricingRuleRow } from '../../../types/admin';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Commission'>;

const ALL_VEHICLE_TYPES = Object.keys(VEHICLE_META) as VehicleType[];
// The default this business runs on until an admin ever touches a vehicle's
// pricing — matches what a brand-new PricingRule row is seeded with
// (PricingEditScreen's BLANK.commission_percent), shown here only as the
// "no row yet" placeholder, never written anywhere on its own.
const DEFAULT_COMMISSION_PERCENT = 15;

export default function CommissionScreen() {
  const navigation = useNavigation<Nav>();
  const fetcher = useCallback(() => adminApi.getPricing(), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);
  const byType = new Map<string, PricingRuleRow>((data ?? []).map((r) => [r.vehicle_type, r]));

  return (
    <AdminScreen
      title="Commission Settings"
      subtitle="Rider vs. company share of each fare"
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        ALL_VEHICLE_TYPES.map((vt) => {
          const rule = byType.get(vt);
          const meta = VEHICLE_META[vt];
          const companyPct = rule?.commission_percent ?? DEFAULT_COMMISSION_PERCENT;
          const riderPct = 100 - companyPct;
          return (
            <SectionCard key={vt} title={meta.label}>
              <View style={styles.row}>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Rider</Text>
                  <Text style={styles.pillValue}>{riderPct}%</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Company</Text>
                  <Text style={styles.pillValue}>{companyPct}%</Text>
                </View>
                <View style={[styles.pill, styles.pillTotal]}>
                  <Text style={styles.pillLabel}>Total</Text>
                  <Text style={styles.pillValue}>100%</Text>
                </View>
              </View>
              {!rule ? (
                <Text style={styles.notSet}>Not configured yet — showing the fallback default.</Text>
              ) : null}
              <Pressable onPress={() => navigation.navigate('PricingEdit', { vehicleType: vt })}>
                <Text style={styles.editLink}>Edit commission →</Text>
              </Pressable>
            </SectionCard>
          );
        })
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Commission is set per vehicle type since bike/auto/car can carry different rates. Rider
          % is always the complement of company % — the two can never add up to anything but 100.
        </Text>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  pill: {
    flex: 1,
    backgroundColor: colors.surface50,
    borderRadius: radius.control,
    padding: space.sm,
    alignItems: 'center',
    gap: 2,
  },
  pillTotal: { backgroundColor: colors.accentFaint },
  pillLabel: { fontFamily: font.medium, fontSize: 11, color: colors.ink400 },
  pillValue: { fontFamily: font.extrabold, fontSize: 18, color: colors.navy800 },
  notSet: { fontFamily: font.medium, fontSize: 12, color: colors.accentDark, marginBottom: space.xs },
  editLink: { fontFamily: font.bold, fontSize: 12.5, color: colors.accentDark },
  footer: { paddingTop: 4 },
  footerText: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, color: colors.ink400, textAlign: 'center' },
});
