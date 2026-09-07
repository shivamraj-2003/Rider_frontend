import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font } from '../../../theme';
import { VEHICLE_META } from '../../../types';
import type { VehicleType } from '../../../types';
import type { PricingRuleRow } from '../../../types/admin';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'Pricing'>;

// Fixed set — vehicle types aren't admin-creatable entities, they're defined
// by the app itself (VEHICLE_META). A type with no row yet just means it's
// still running on the backend's built-in fallback rates; tapping it lets
// the admin configure (create) its rule for the first time.
const ALL_VEHICLE_TYPES = Object.keys(VEHICLE_META) as VehicleType[];

export default function PricingScreen() {
  const navigation = useNavigation<Nav>();
  const fetcher = useCallback(() => adminApi.getPricing(), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  const byType = new Map<string, PricingRuleRow>((data ?? []).map((r) => [r.vehicle_type, r]));

  return (
    <AdminScreen title="Vehicle Pricing" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <SectionCard padded={false}>
          {ALL_VEHICLE_TYPES.map((vt, i) => {
            const rule = byType.get(vt);
            const meta = VEHICLE_META[vt];
            return (
              <ListRow
                key={vt}
                leading={<meta.icon size={20} color={colors.navy600} strokeWidth={2} />}
                title={meta.label}
                subtitle={
                  rule
                    ? `${money(rule.tier1_fare)} up to ${rule.tier1_km}km · ${money(rule.base_fare)} up to ${rule.tier2_km}km · ${money(rule.per_km_rate)}/km after`
                    : 'Not configured — using default rates'
                }
                trailing={
                  rule ? (
                    <StatusBadge status={rule.is_active ? 'active' : 'inactive'} />
                  ) : (
                    <StatusBadge status="not_set" tone="neutral" />
                  )
                }
                chevron
                divider={i < ALL_VEHICLE_TYPES.length - 1}
                onPress={() => navigation.navigate('PricingEdit', { vehicleType: vt })}
              />
            );
          })}
        </SectionCard>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Changes apply to new rides within seconds. Rides already booked or completed keep the
          fare they were quoted at — editing a rate here never rewrites history.
        </Text>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  footer: { paddingTop: 4 },
  footerText: { fontFamily: font.regular, fontSize: 11, color: colors.ink400, textAlign: 'center' },
});
