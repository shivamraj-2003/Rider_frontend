import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, Switch } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import SegmentedTabs from '../../../components/admin/SegmentedTabs';
import TextField from '../../../components/TextField';
import Button from '../../../components/Button';
import { LoadingState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import * as adminApi from '../../../services/admin';
import { ApiError } from '../../../context/AuthContext';
import { colors, font, space } from '../../../theme';
import type { PromotionInput } from '../../../types/admin';
import type { MoreStackParamList } from '../../../navigation/AdminNavigator';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'OfferEdit'>;
type Rt = RouteProp<MoreStackParamList, 'OfferEdit'>;

export default function OfferEditScreen() {
  const navigation = useNavigation<Nav>();
  const offerId = useRoute<Rt>().params?.offerId;
  const editing = !!offerId;
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<PromotionInput>({
    code: '',
    title: '',
    description: '',
    discount_type: 'percent',
    discount_value: 10,
    max_discount: null,
    min_fare: null,
    usage_limit: null,
    is_active: true,
  });
  const [hydrated, setHydrated] = useState(!editing);

  const fetcher = useCallback(
    () => (offerId ? adminApi.getOffers(false) : Promise.resolve([])),
    [offerId]
  );
  const { data, loading } = useAdminQuery(fetcher, { refetchOnFocus: false });

  useEffect(() => {
    if (editing && data && !hydrated) {
      const found = data.find((o) => o.id === offerId);
      if (found) {
        setForm({
          code: found.code,
          title: found.title,
          description: found.description ?? '',
          discount_type: found.discount_type,
          discount_value: found.discount_value,
          max_discount: found.max_discount,
          min_fare: found.min_fare,
          usage_limit: found.usage_limit,
          is_active: found.is_active,
        });
      }
      setHydrated(true);
    }
  }, [editing, data, hydrated, offerId]);

  const set = <K extends keyof PromotionInput>(k: K, v: PromotionInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const num = (t: string): number | null => {
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    if (!form.code.trim() || !form.title.trim() || !form.discount_value) {
      Alert.alert('Missing fields', 'Code, title and discount value are required.');
      return;
    }
    setBusy(true);
    try {
      if (editing && offerId) {
        await adminApi.updateOffer(offerId, form);
      } else {
        await adminApi.createOffer({ ...form, code: form.code.trim().toUpperCase() });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Save failed', e instanceof ApiError ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!offerId) return;
    Alert.alert('Delete offer?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await adminApi.deleteOffer(offerId);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Failed', e instanceof ApiError ? e.message : 'Try again.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  if (editing && (loading || !hydrated)) {
    return (
      <AdminScreen title="Edit Offer">
        <LoadingState />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen title={editing ? 'Edit Offer' : 'New Offer'}>
      <SectionCard>
        <View style={styles.form}>
          <TextField
            label="Code"
            value={form.code}
            onChangeText={(t) => set('code', t.toUpperCase())}
            autoCapitalize="characters"
            editable={!editing}
            placeholder="WELCOME20"
          />
          <TextField
            label="Title"
            value={form.title}
            onChangeText={(t) => set('title', t)}
            placeholder="Weekend offer"
          />
          <TextField
            label="Description"
            value={form.description}
            onChangeText={(t) => set('description', t)}
            placeholder="Get 20% off your next 3 rides"
          />

          <Text style={styles.fieldLabel}>Discount type</Text>
          <SegmentedTabs
            options={[
              { value: 'percent', label: 'Percent' },
              { value: 'flat', label: 'Flat ₹' },
            ]}
            value={form.discount_type}
            onChange={(v) => set('discount_type', v as 'percent' | 'flat')}
          />

          <TextField
            label={form.discount_type === 'percent' ? 'Discount %' : 'Discount ₹'}
            value={String(form.discount_value ?? '')}
            onChangeText={(t) => set('discount_value', num(t) ?? 0)}
            keyboardType="numeric"
          />
          {form.discount_type === 'percent' ? (
            <TextField
              label="Max discount ₹ (optional)"
              value={form.max_discount != null ? String(form.max_discount) : ''}
              onChangeText={(t) => set('max_discount', num(t))}
              keyboardType="numeric"
            />
          ) : null}
          <TextField
            label="Minimum fare ₹ (optional)"
            value={form.min_fare != null ? String(form.min_fare) : ''}
            onChangeText={(t) => set('min_fare', num(t))}
            keyboardType="numeric"
          />
          <TextField
            label="Usage limit (optional)"
            value={form.usage_limit != null ? String(form.usage_limit) : ''}
            onChangeText={(t) => set('usage_limit', num(t) ? Math.round(num(t)!) : null)}
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Active</Text>
            <Switch
              value={!!form.is_active}
              onValueChange={(v) => set('is_active', v)}
              trackColor={{ true: colors.accent }}
            />
          </View>
        </View>
      </SectionCard>

      <Button title={editing ? 'Save changes' : 'Create offer'} variant="navy" loading={busy} onPress={save} />
      {editing ? <Button title="Delete offer" variant="primary" loading={busy} onPress={remove} /> : null}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.md },
  fieldLabel: { fontFamily: font.bold, fontSize: 12, color: colors.ink600 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
