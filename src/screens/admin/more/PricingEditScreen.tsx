import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Switch } from 'react-native';
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
import { colors, font, space } from '../../../theme';
import { VEHICLE_META } from '../../../types';
import type { PricingRuleInput } from '../../../types/admin';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'PricingEdit'>;
type Rt = RouteProp<MoreStackParamList, 'PricingEdit'>;

// A brand-new vehicle type (no row in the DB yet) starts fully blank/zero —
// never pre-filled with a "reasonable-looking" number. Required-field
// validation below is what actually stops an admin from saving a ₹0 base
// fare by accident; nothing here is a real fare until they type one in.
const BLANK: PricingRuleInput = {
  tier1_km: 0.5,
  tier1_fare: 0,
  tier2_km: 2,
  base_fare: 0,
  per_km_rate: 0,
  per_minute_rate: 0,
  minimum_fare: 0,
  commission_percent: 15,
  cancellation_fee: 0,
  free_waiting_minutes: 5,
  waiting_charge_per_minute: 0,
  surge_multiplier: 1,
  is_active: true,
};

export default function PricingEditScreen() {
  const navigation = useNavigation<Nav>();
  const { vehicleType } = useRoute<Rt>().params;
  const meta = VEHICLE_META[vehicleType];
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<PricingRuleInput>(BLANK);
  const [hydrated, setHydrated] = useState(false);

  const fetcher = useCallback(() => adminApi.getPricing(), []);
  const { data, loading } = useAdminQuery(fetcher, { refetchOnFocus: false });

  useEffect(() => {
    if (data && !hydrated) {
      const found = data.find((r) => r.vehicle_type === vehicleType);
      if (found) {
        const { vehicle_type: _vt, ...rest } = found;
        setForm(rest);
      }
      setHydrated(true);
    }
  }, [data, hydrated, vehicleType]);

  const set = <K extends keyof PricingRuleInput>(k: K, v: PricingRuleInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const num = (t: string): number => {
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : 0;
  };

  const riderPercent = Math.max(0, 100 - form.commission_percent);

  const save = async () => {
    if (form.base_fare <= 0) {
      Alert.alert('Invalid pricing', 'Flat fare must be greater than ₹0.');
      return;
    }
    if (form.tier1_km >= form.tier2_km) {
      Alert.alert('Invalid slabs', 'Short-hop distance must be less than the flat-fare distance.');
      return;
    }
    if (form.commission_percent < 0 || form.commission_percent > 100) {
      Alert.alert('Invalid commission', 'Commission must be between 0% and 100%.');
      return;
    }
    setBusy(true);
    try {
      await adminApi.putPricing(vehicleType, form);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Save failed', e instanceof ApiError ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !hydrated) {
    return (
      <AdminScreen title={`Edit ${meta.label} pricing`}>
        <LoadingState />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen title={`${meta.label} pricing`} subtitle="Applies to new rides within seconds">
      <SectionCard title="Fare">
        <View style={styles.form}>
          <Text style={styles.slabNote}>
            Distance-slab pricing. A flat short-hop fare up to the first distance,
            then a flat fare up to the second distance, then a per-km rate for
            every kilometre past it.
          </Text>
          <TextField
            label="Short-hop distance (km)"
            value={String(form.tier1_km)}
            onChangeText={(t) => set('tier1_km', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label={`Short-hop fare — up to ${form.tier1_km} km (₹)`}
            value={String(form.tier1_fare)}
            onChangeText={(t) => set('tier1_fare', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Flat-fare distance (km)"
            value={String(form.tier2_km)}
            onChangeText={(t) => set('tier2_km', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label={`Flat fare — up to ${form.tier2_km} km (₹)`}
            value={String(form.base_fare)}
            onChangeText={(t) => set('base_fare', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label={`Rate per km — beyond ${form.tier2_km} km (₹)`}
            value={String(form.per_km_rate)}
            onChangeText={(t) => set('per_km_rate', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Rate per minute (₹, optional)"
            value={String(form.per_minute_rate)}
            onChangeText={(t) => set('per_minute_rate', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Minimum fare (₹, 0 = slab governs)"
            value={String(form.minimum_fare)}
            onChangeText={(t) => set('minimum_fare', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Surge multiplier (1 = no surge)"
            value={String(form.surge_multiplier)}
            onChangeText={(t) => set('surge_multiplier', num(t))}
            keyboardType="decimal-pad"
          />
        </View>
      </SectionCard>

      <SectionCard title="Waiting & cancellation">
        <View style={styles.form}>
          <TextField
            label="Free waiting minutes at pickup"
            value={String(form.free_waiting_minutes)}
            onChangeText={(t) => set('free_waiting_minutes', Math.round(num(t)))}
            keyboardType="number-pad"
          />
          <TextField
            label="Waiting charge per minute (₹, optional)"
            value={String(form.waiting_charge_per_minute)}
            onChangeText={(t) => set('waiting_charge_per_minute', num(t))}
            keyboardType="decimal-pad"
          />
          <TextField
            label="Cancellation fee (₹, optional)"
            value={String(form.cancellation_fee)}
            onChangeText={(t) => set('cancellation_fee', num(t))}
            keyboardType="decimal-pad"
          />
        </View>
      </SectionCard>

      <SectionCard title="Commission split">
        <View style={styles.form}>
          <TextField
            label="Company commission %"
            value={String(form.commission_percent)}
            onChangeText={(t) => set('commission_percent', num(t))}
            keyboardType="decimal-pad"
          />
          <View style={styles.splitRow}>
            <View style={styles.splitPill}>
              <Text style={styles.splitLabel}>Rider gets</Text>
              <Text style={styles.splitValue}>{riderPercent}%</Text>
            </View>
            <View style={styles.splitPill}>
              <Text style={styles.splitLabel}>Company gets</Text>
              <Text style={styles.splitValue}>{form.commission_percent}%</Text>
            </View>
          </View>
          <Text style={styles.splitNote}>
            The rider's share is always 100% minus the company's — there's no way to save a
            combination that doesn't add up to 100%.
          </Text>
        </View>
      </SectionCard>

      <SectionCard>
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Active</Text>
          <Switch
            value={form.is_active}
            onValueChange={(v) => set('is_active', v)}
            trackColor={{ true: colors.accent }}
          />
        </View>
      </SectionCard>

      <Button title="Save changes" variant="navy" loading={busy} onPress={save} />
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.md },
  fieldLabel: { fontFamily: font.bold, fontSize: 12, color: colors.ink600 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  splitRow: { flexDirection: 'row', gap: space.sm },
  splitPill: {
    flex: 1,
    backgroundColor: colors.surface50,
    borderRadius: 12,
    padding: space.sm,
    alignItems: 'center',
    gap: 2,
  },
  splitLabel: { fontFamily: font.medium, fontSize: 11, color: colors.ink400 },
  splitValue: { fontFamily: font.extrabold, fontSize: 18, color: colors.navy800 },
  splitNote: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 17, color: colors.ink400 },
  slabNote: { fontFamily: font.regular, fontSize: 11.5, lineHeight: 17, color: colors.ink400 },
});
