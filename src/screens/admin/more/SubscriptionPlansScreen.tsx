import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconPlus } from '@tabler/icons-react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import StatusBadge from '../../../components/admin/StatusBadge';
import { LoadingState, ErrorState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { money } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font, radius } from '../../../theme';
import { VEHICLE_META } from '../../../types';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'SubscriptionPlans'>;

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation<Nav>();
  const fetcher = useCallback(() => adminApi.getSubscriptionPlans(), []);
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  const addButton = (
    <Pressable
      onPress={() => navigation.navigate('SubscriptionPlanEdit', {})}
      hitSlop={10}
      style={styles.addBtn}
      accessibilityRole="button"
      accessibilityLabel="New plan"
    >
      <IconPlus size={19} color={colors.white} strokeWidth={2.4} />
    </Pressable>
  );

  return (
    <AdminScreen
      title="Commute Plans"
      subtitle="Customer Home ⇄ Office subscriptions"
      right={addButton}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No commute plans yet</Text>
          <Text style={styles.emptyBody}>
            Create a plan to let customers subscribe to a fixed daily Home ⇄ Office commute.
          </Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('SubscriptionPlanEdit', {})}
          >
            <Text style={styles.emptyBtnText}>+ New plan</Text>
          </Pressable>
        </View>
      ) : (
        <SectionCard padded={false}>
          {data.map((plan, i) => {
            const meta = VEHICLE_META[plan.vehicle_type];
            return (
              <ListRow
                key={plan.id}
                leading={meta ? <meta.icon size={20} color={colors.navy600} strokeWidth={2} /> : undefined}
                title={plan.name}
                subtitle={`${meta?.label ?? plan.vehicle_type} · ${money(plan.monthly_price)}/mo · ${plan.included_rides} rides / ${plan.validity_days}d`}
                trailing={<StatusBadge status={plan.is_active ? 'active' : 'inactive'} />}
                chevron
                divider={i < data.length - 1}
                onPress={() => navigation.navigate('SubscriptionPlanEdit', { planId: plan.id })}
              />
            );
          })}
        </SectionCard>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Editing a plan only affects new purchases — customers already subscribed keep the terms
          they bought under, snapshotted at purchase time.
        </Text>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy800,
  },
  footer: { paddingTop: 4 },
  footerText: { fontFamily: font.regular, fontSize: 11, color: colors.ink400, textAlign: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 16 },
  emptyTitle: { fontFamily: font.bold, fontSize: 15, color: colors.navy800 },
  emptyBody: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink400, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: colors.navy800,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: { fontFamily: font.bold, fontSize: 13, color: colors.white },
});
