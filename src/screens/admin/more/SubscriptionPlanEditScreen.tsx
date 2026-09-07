import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, Switch } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import TextField from '../../../components/TextField';
import Button from '../../../components/Button';
import { LoadingState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { colors, font, radius, space } from '../../../theme';
import { VEHICLE_META } from '../../../types';
import type { VehicleType } from '../../../types';
import type { SubscriptionPlanInput } from '../../../types/admin';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'SubscriptionPlanEdit'>;
type Rt = RouteProp<MoreStackParamList, 'SubscriptionPlanEdit'>;

const VEHICLE_TYPES = Object.keys(VEHICLE_META) as VehicleType[];

// A brand-new plan starts fully blank/zero, same convention as pricing's
// BLANK constant — nothing here is a real, saveable value until an admin
// types one in; required-field validation below is what actually blocks it.
const BLANK: SubscriptionPlanInput = {
  name: '',
  vehicle_type: 'bike',
  monthly_price: 0,
  included_rides: 0,
  working_days: 0,
  trip_type: 'round_trip',
  max_km_per_trip: 0,
  extra_km_charge: 0,
  extra_ride_charge: 0,
  discount_percent: 0,
  validity_days: 30,
  cancellation_window_hours: 2,
  cancel_within_window_deducts_ride: true,
  pause_allowed: true,
  max_pause_days: 7,
  extend_validity_on_pause: true,
  is_active: true,
};

export default function SubscriptionPlanEditScreen() {
  const navigation = useNavigation<Nav>();
  const { planId } = useRoute<Rt>().params ?? {};
  const isNew = !planId;
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<SubscriptionPlanInput>(BLANK);
  const [hydrated, setHydrated] = useState(isNew);

  const fetcher = useCallback(() => adminApi.getSubscriptionPlans(), []);
  const { data, loading } = useAdminQuery(fetcher, { refetchOnFocus: false });

  useEffect(() => {
    if (!isNew && data && !hydrated) {
      const found = data.find((p) => p.id === planId);
      if (found) {
        const { id: _id, ...rest } = found;
        setForm(rest);
      }
      setHydrated(true);
    }
  }, [data, hydrated, isNew, planId]);

  const set = <K extends keyof SubscriptionPlanInput>(k: K, v: SubscriptionPlanInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const num = (t: string): number => {
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : 0;
  };
  const int = (t: string): number => {
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Missing name', 'Give this plan a name customers will recognise.');
      return;
    }
    if (form.monthly_price <= 0) {
      Alert.alert('Invalid price', 'Monthly price must be greater than ₹0.');
      return;
    }
    if (form.included_rides <= 0) {
      Alert.alert('Invalid rides', 'Included rides must be greater than 0.');
      return;
    }
    if (form.max_km_per_trip <= 0) {
      Alert.alert('Invalid distance', 'Max km per trip must be greater than 0.');
      return;
    }
    setBusy(true);
    try {
      if (isNew) {
        await adminApi.createSubscriptionPlan(form);
      } else {
        await adminApi.updateSubscriptionPlan(planId!, form);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Save failed', e instanceof ApiError ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!isNew && loading && !hydrated) {
    return (
      <AdminScreen title="Edit plan">
        <LoadingState />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen
      title={isNew ? 'New commute plan' : 'Edit commute plan'}
      subtitle="Applies to new purchases only"
    >
      <SectionCard title="Basics">
        <View style={styles.form}>
          <TextField
            label="Plan name"
            value={form.name}
            onChangeText={(t) => set('name', t)}
            placeholder="e.g. Bike Commute Basic"
          />
          <Text style={styles.fieldLabel}>Vehicle type</Text>
          <View style={styles.chipRow}>
            {VEHICLE_TYPES.map((vt) => {
              const meta = VEHICLE_META[vt];
              const selected = form.vehicle_type === vt;
              return (
                <Pressable
                  key={vt}
                  onPress={() => set('vehicle_type', vt)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <meta.icon size={16} color={selected ? colors.accentDark : colors.ink600} strokeWidth={2} />
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>Trip type</Text>
          <View style={styles.chipRow}>
            {(['one_way', 'round_trip'] as const).map((tt) => {
              const selected = form.trip_type === tt;
              return (
                <Pressable
                  key={tt}
                  onPress={() => set('trip_type', tt)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {tt === 'one_way' ? 'One way' : 'Round trip'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Price & rides">
        <View style={styles.form}>
          <TextField
            label="Monthly price (₹)"
            value={String(form.monthly_price)}
            onChangeText={(t) => set('monthly_price', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Included rides"
            value={String(form.included_rides)}
            onChangeText={(t) => set('included_rides', int(t))}
            keyboardType="number-pad"
          />
          <TextField
            label="Working days per cycle"
            value={String(form.working_days)}
            onChangeText={(t) => set('working_days', int(t))}
            keyboardType="number-pad"
          />
          <TextField
            label="Validity (days)"
            value={String(form.validity_days)}
            onChangeText={(t) => set('validity_days', int(t))}
            keyboardType="number-pad"
          />
          <TextField
            label="Discount % (optional)"
            value={String(form.discount_percent)}
            onChangeText={(t) => set('discount_percent', num(t))}
            keyboardType="decimal-pad"
          />
        </View>
      </SectionCard>

      <SectionCard title="Route limit & overage charges">
        <View style={styles.form}>
          <TextField
            label="Max km per trip"
            value={String(form.max_km_per_trip)}
            onChangeText={(t) => set('max_km_per_trip', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Extra km charge (₹/km, optional)"
            value={String(form.extra_km_charge)}
            onChangeText={(t) => set('extra_km_charge', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Extra ride charge (₹, optional)"
            value={String(form.extra_ride_charge)}
            onChangeText={(t) => set('extra_ride_charge', num(t))}
            keyboardType="decimal-pad"
          />
        </View>
      </SectionCard>

      <SectionCard title="Cancellation & pause policy">
        <View style={styles.form}>
          <TextField
            label="Cancellation window (hours before pickup)"
            value={String(form.cancellation_window_hours)}
            onChangeText={(t) => set('cancellation_window_hours', int(t))}
            keyboardType="number-pad"
          />
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Cancelling within window deducts a ride</Text>
            <Switch
              value={form.cancel_within_window_deducts_ride}
              onValueChange={(v) => set('cancel_within_window_deducts_ride', v)}
              trackColor={{ true: colors.accent }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Pausing allowed</Text>
            <Switch
              value={form.pause_allowed}
              onValueChange={(v) => set('pause_allowed', v)}
              trackColor={{ true: colors.accent }}
            />
          </View>
          {form.pause_allowed ? (
            <>
              <TextField
                label="Max pause days"
                value={String(form.max_pause_days)}
                onChangeText={(t) => set('max_pause_days', int(t))}
                keyboardType="number-pad"
              />
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Extend validity by days paused</Text>
                <Switch
                  value={form.extend_validity_on_pause}
                  onValueChange={(v) => set('extend_validity_on_pause', v)}
                  trackColor={{ true: colors.accent }}
                />
              </View>
            </>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard>
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Active (visible to customers)</Text>
          <Switch
            value={form.is_active}
            onValueChange={(v) => set('is_active', v)}
            trackColor={{ true: colors.accent }}
          />
        </View>
      </SectionCard>

      <Button title={isNew ? 'Create plan' : 'Save changes'} variant="navy" loading={busy} onPress={save} />
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.md },
  fieldLabel: { fontFamily: font.bold, fontSize: 12, color: colors.ink600 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line200,
    backgroundColor: colors.white,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accentFaint },
  chipLabel: { fontFamily: font.semibold, fontSize: 12.5, color: colors.ink600 },
  chipLabelSelected: { color: colors.accentDark },
});
