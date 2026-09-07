import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconClock, IconMapPin, IconRepeat } from '@tabler/icons-react-native';
import ScreenScaffold from '../../../components/ScreenScaffold';
import Button from '../../../components/Button';
import { GlyphTile, Badge } from '../../../components/booking';
import {
  getSubscriptionPlans,
  getMySubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
} from '../../../services/subscriptions';
import { ApiError } from '../../../services/api';
import { colors, font, radius, shadow, space } from '../../../theme';
import { VEHICLE_META, rupees } from '../../../types';
import type { Subscription, SubscriptionPlan, VehicleType } from '../../../types';
import type { CustomerStackParamList } from '../../../navigation/CustomerNavigator';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

const STATUS_TONE: Record<string, 'accent' | 'outline'> = {
  active: 'accent',
  paused: 'outline',
  expired: 'outline',
  cancelled: 'outline',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

const DAY_LABEL: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

export default function CommuteSubscriptionScreen() {
  const navigation = useNavigation<Nav>();
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const sub = await getMySubscription();
      setSubscription(sub);
      if (!sub) setPlans(await getSubscriptionPlans());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your subscription');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const withBusy = async (fn: () => Promise<Subscription>) => {
    setActing(true);
    try {
      setSubscription(await fn());
    } catch (err) {
      Alert.alert('Could not complete this', err instanceof ApiError ? err.message : 'Try again.');
    } finally {
      setActing(false);
    }
  };

  const confirmCancel = (id: string) => {
    Alert.alert('Cancel your commute subscription?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel subscription', style: 'destructive', onPress: () => withBusy(() => cancelSubscription(id)) },
    ]);
  };

  const promptPause = (id: string, maxDays: number) => {
    Alert.alert(
      'Pause commute',
      `How many days? (up to ${maxDays})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '3 days', onPress: () => withBusy(() => pauseSubscription(id, Math.min(3, maxDays))) },
        { text: '7 days', onPress: () => withBusy(() => pauseSubscription(id, Math.min(7, maxDays))) },
      ]
    );
  };

  if (subscription === undefined) {
    return (
      <ScreenScaffold title="Commute Subscription">
        <ActivityIndicator color={colors.accentDark} style={{ marginTop: space.xxl }} />
      </ScreenScaffold>
    );
  }

  if (error && !subscription && !plans) {
    return (
      <ScreenScaffold title="Commute Subscription">
        <Text style={styles.error}>{error}</Text>
        <Button title="Retry" onPress={load} />
      </ScreenScaffold>
    );
  }

  // --- Has a subscription: dashboard -------------------------------------
  if (subscription) {
    const meta = VEHICLE_META[subscription.vehicle_type];
    return (
      <ScreenScaffold title="My Commute Subscription">
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <GlyphTile icon={meta.icon} tone="dark" />
            <View style={styles.heroBody}>
              <Text style={styles.heroTitle}>{subscription.plan_name}</Text>
              <Text style={styles.heroSub}>{meta.label} · {rupees(subscription.monthly_price)}/month</Text>
            </View>
            <Badge label={subscription.status.toUpperCase()} variant={STATUS_TONE[subscription.status] ?? 'outline'} />
          </View>
          {subscription.is_expiring_soon ? (
            <Text style={styles.expiring}>Expires {fmtDate(subscription.end_date)} — renew to keep your commute.</Text>
          ) : null}
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <IconMapPin size={16} color={colors.accentDark} strokeWidth={2} />
            <Text style={styles.routeText} numberOfLines={1}>{subscription.home_address}</Text>
          </View>
          <Text style={styles.routeArrow}>↓ {fmtTime(subscription.pickup_time)}</Text>
          <View style={styles.routeRow}>
            <IconMapPin size={16} color={colors.danger} strokeWidth={2} />
            <Text style={styles.routeText} numberOfLines={1}>{subscription.office_address}</Text>
          </View>
          {subscription.return_time ? (
            <>
              <Text style={styles.routeArrow}>↓ {fmtTime(subscription.return_time)}</Text>
              <View style={styles.routeRow}>
                <IconMapPin size={16} color={colors.accentDark} strokeWidth={2} />
                <Text style={styles.routeText} numberOfLines={1}>{subscription.home_address}</Text>
              </View>
            </>
          ) : null}
          <Text style={styles.days}>
            {subscription.days.map((d) => DAY_LABEL[d]).join(' · ')}
          </Text>
        </View>

        <View style={styles.usageRow}>
          <View style={styles.usageStat}>
            <Text style={styles.usageValue}>{subscription.total_rides}</Text>
            <Text style={styles.usageLabel}>Total rides</Text>
          </View>
          <View style={styles.usageStat}>
            <Text style={styles.usageValue}>{subscription.used_rides}</Text>
            <Text style={styles.usageLabel}>Used</Text>
          </View>
          <View style={styles.usageStat}>
            <Text style={[styles.usageValue, styles.usageRemaining]}>{subscription.remaining_rides}</Text>
            <Text style={styles.usageLabel}>Remaining</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Distance {subscription.route_distance_km.toFixed(1)} km/trip</Text>
          <Text style={styles.metaText}>Valid until {fmtDate(subscription.end_date)}</Text>
        </View>

        <View style={styles.actions}>
          {subscription.status === 'active' ? (
            <>
              {subscription.pause_allowed ? (
                <Button
                  title="Pause"
                  variant="secondary"
                  loading={acting}
                  onPress={() => promptPause(subscription.id, subscription.max_pause_days)}
                />
              ) : null}
              <Button
                title="Cancel"
                variant="secondary"
                loading={acting}
                onPress={() => confirmCancel(subscription.id)}
              />
            </>
          ) : null}
          {subscription.status === 'paused' ? (
            <Button title="Resume" loading={acting} onPress={() => withBusy(() => resumeSubscription(subscription.id))} />
          ) : null}
          {(subscription.status === 'expired' || subscription.is_expiring_soon) ? (
            <Button
              title="Renew subscription"
              variant="navy"
              loading={acting}
              onPress={() => withBusy(() => renewSubscription(subscription.id))}
            />
          ) : null}
          {subscription.status === 'cancelled' ? (
            <Button title="Subscribe again" variant="navy" onPress={() => setSubscription(null)} />
          ) : null}
        </View>
      </ScreenScaffold>
    );
  }

  // --- No subscription: browse plans --------------------------------------
  const vehicleTypes = Array.from(new Set((plans ?? []).map((p) => p.vehicle_type))) as VehicleType[];
  const visiblePlans = (plans ?? []).filter((p) => !vehicleFilter || p.vehicle_type === vehicleFilter);

  return (
    <ScreenScaffold title="Commute Subscription">
      <View style={styles.intro}>
        <IconRepeat size={22} color={colors.accentDark} strokeWidth={1.8} />
        <Text style={styles.introTitle}>Same commute, every working day</Text>
        <Text style={styles.introSub}>
          Buy a monthly Home ↔ Office pass once — no need to book the same ride manually every day.
        </Text>
      </View>

      {plans === null ? (
        <ActivityIndicator color={colors.accentDark} style={{ marginTop: space.xl }} />
      ) : plans.length === 0 ? (
        <Text style={styles.empty}>No commute plans are available right now.</Text>
      ) : (
        <>
          {vehicleTypes.length > 1 ? (
            <View style={styles.filterRow}>
              <Pressable
                onPress={() => setVehicleFilter(null)}
                style={[styles.filterChip, !vehicleFilter && styles.filterChipActive]}
              >
                <Text style={[styles.filterLabel, !vehicleFilter && styles.filterLabelActive]}>All</Text>
              </Pressable>
              {vehicleTypes.map((vt) => (
                <Pressable
                  key={vt}
                  onPress={() => setVehicleFilter(vt)}
                  style={[styles.filterChip, vehicleFilter === vt && styles.filterChipActive]}
                >
                  <Text style={[styles.filterLabel, vehicleFilter === vt && styles.filterLabelActive]}>
                    {VEHICLE_META[vt].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.planList}>
            {visiblePlans.map((plan) => {
              const meta = VEHICLE_META[plan.vehicle_type];
              return (
                <Pressable
                  key={plan.id}
                  style={styles.planCard}
                  onPress={() => navigation.navigate('SubscribeCommute', { planId: plan.id })}
                >
                  <View style={styles.planTop}>
                    <GlyphTile icon={meta.icon} tone="accent" />
                    <View style={styles.planBody}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <Text style={styles.planSub}>
                        {plan.included_rides} rides · {plan.trip_type === 'round_trip' ? 'Round trip' : 'One way'} · up to {plan.max_km_per_trip} km
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planFooter}>
                    <Text style={styles.planPrice}>{rupees(plan.monthly_price)}<Text style={styles.planPriceSuffix}>/month</Text></Text>
                    <View style={styles.planCta}>
                      <IconClock size={14} color={colors.accentDark} strokeWidth={2} />
                      <Text style={styles.planCtaLabel}>{plan.validity_days} days</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger, marginBottom: space.md },
  intro: { alignItems: 'center', gap: 6 },
  introTitle: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy800, textAlign: 'center' },
  introSub: { fontFamily: font.regular, fontSize: 13, color: colors.ink600, textAlign: 'center', lineHeight: 19 },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.ink400, textAlign: 'center', marginTop: space.xxl },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface100 },
  filterChipActive: { backgroundColor: colors.navy800 },
  filterLabel: { fontFamily: font.bold, fontSize: 12.5, color: colors.ink600 },
  filterLabelActive: { color: colors.white },
  planList: { gap: space.md },
  planCard: {
    backgroundColor: colors.white, borderRadius: radius.card, padding: space.md,
    borderWidth: 1, borderColor: colors.line100, gap: space.sm, ...shadow.card,
  },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  planBody: { flex: 1, gap: 2 },
  planName: { fontFamily: font.extrabold, fontSize: 15.5, color: colors.navy800 },
  planSub: { fontFamily: font.regular, fontSize: 12, color: colors.ink600 },
  planFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.line100 },
  planPrice: { fontFamily: font.extrabold, fontSize: 18, color: colors.navy800, paddingTop: 6 },
  planPriceSuffix: { fontFamily: font.medium, fontSize: 12, color: colors.ink400 },
  planCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planCtaLabel: { fontFamily: font.bold, fontSize: 11.5, color: colors.accentDark },

  heroCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, gap: space.sm, ...shadow.card },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  heroBody: { flex: 1, gap: 2 },
  heroTitle: { fontFamily: font.extrabold, fontSize: 16, color: colors.navy800 },
  heroSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  expiring: { fontFamily: font.medium, fontSize: 12.5, color: colors.accentDark, backgroundColor: colors.accentTint, borderRadius: radius.control, padding: 10 },
  routeCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, gap: 6, borderWidth: 1, borderColor: colors.line100 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.navy800, flex: 1 },
  routeArrow: { fontFamily: font.medium, fontSize: 11.5, color: colors.ink400, marginLeft: 24 },
  days: { fontFamily: font.bold, fontSize: 12, color: colors.accentDark, marginTop: 4 },
  usageRow: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line100 },
  usageStat: { flex: 1, alignItems: 'center', paddingVertical: space.md, gap: 2 },
  usageValue: { fontFamily: font.extrabold, fontSize: 20, color: colors.navy800 },
  usageRemaining: { color: colors.accentDark },
  usageLabel: { fontFamily: font.medium, fontSize: 11, color: colors.ink400 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontFamily: font.medium, fontSize: 11.5, color: colors.ink400 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
