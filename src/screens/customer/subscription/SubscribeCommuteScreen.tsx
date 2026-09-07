import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconAlertTriangle } from '@tabler/icons-react-native';
import ScreenScaffold from '../../../components/ScreenScaffold';
import Button from '../../../components/Button';
import LocationPickerField from '../../../components/subscription/LocationPickerField';
import {
  getSubscriptionPlans,
  previewSubscriptionRoute,
  createSubscription,
} from '../../../services/subscriptions';
import { ApiError } from '../../../services/api';
import { colors, font, radius, shadow, space } from '../../../theme';
import { COMMUTE_DAYS, VEHICLE_META, rupees } from '../../../types';
import type { CommuteDay, RoutePreview, SubscriptionLocation, SubscriptionPlan } from '../../../types';
import type { CustomerStackParamList } from '../../../navigation/CustomerNavigator';

type Nav = NativeStackNavigationProp<CustomerStackParamList, 'SubscribeCommute'>;
type Rt = RouteProp<CustomerStackParamList, 'SubscribeCommute'>;

const DAY_LABEL: Record<CommuteDay, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

// Every half hour from 5:00 AM to 11:30 PM — no time-picker library exists
// in this project yet, so a chip row (same pattern as CancelRideSheet's
// reason chips) covers this without adding a native dependency.
const TIME_SLOTS: string[] = Array.from({ length: 38 }, (_, i) => {
  const totalMinutes = 5 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function fmtChip(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function TimeChips({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (t: string) => void;
}) {
  return (
    <View style={styles.chipWrap}>
      {TIME_SLOTS.map((t) => {
        const selected = value === t;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{fmtChip(t)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SubscribeCommuteScreen() {
  const navigation = useNavigation<Nav>();
  const { planId } = useRoute<Rt>().params;

  const [plan, setPlan] = useState<SubscriptionPlan | null | undefined>(undefined);
  const [home, setHome] = useState<SubscriptionLocation | null>(null);
  const [office, setOffice] = useState<SubscriptionLocation | null>(null);
  const [days, setDays] = useState<CommuteDay[]>([]);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [returnTime, setReturnTime] = useState<string | null>(null);
  const [preview, setPreview] = useState<RoutePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionPlans()
      .then((plans) => setPlan(plans.find((p) => p.id === planId) ?? null))
      .catch(() => setPlan(null));
  }, [planId]);

  useEffect(() => {
    if (!plan || !home || !office) {
      setPreview(null);
      return;
    }
    setPreviewing(true);
    setPreviewError(null);
    previewSubscriptionRoute(plan.id, home, office)
      .then(setPreview)
      .catch((err) => setPreviewError(err instanceof ApiError ? err.message : 'Could not calculate the route'))
      .finally(() => setPreviewing(false));
  }, [plan, home, office]);

  const toggleDay = (d: CommuteDay) => {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  };

  const roundTrip = plan?.trip_type === 'round_trip';
  const canSubmit =
    !!plan && !!home && !!office && days.length > 0 && !!pickupTime && (!roundTrip || !!returnTime);

  const submit = async () => {
    if (!plan || !home || !office || !pickupTime) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSubscription({
        plan_id: plan.id,
        home,
        office,
        days,
        pickup_time: pickupTime,
        return_time: roundTrip ? returnTime : null,
      });
      navigation.navigate('CommuteSubscription');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not activate this subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  if (plan === undefined) {
    return (
      <ScreenScaffold title="Set up your commute">
        <ActivityIndicator color={colors.accentDark} style={{ marginTop: space.xxl }} />
      </ScreenScaffold>
    );
  }
  if (plan === null) {
    return (
      <ScreenScaffold title="Set up your commute">
        <Text style={styles.error}>This plan is no longer available.</Text>
        <Button title="Go back" variant="secondary" onPress={() => navigation.goBack()} />
      </ScreenScaffold>
    );
  }

  const meta = VEHICLE_META[plan.vehicle_type];

  return (
    <ScreenScaffold title="Set up your commute" subtitle={`${plan.name} · ${rupees(plan.monthly_price)}/month`}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Home &amp; Office</Text>
        <View style={styles.card}>
          <LocationPickerField label="Home" tone="accent" value={home} onChange={setHome} placeholder="Set your home address" />
          <LocationPickerField label="Office" tone="danger" value={office} onChange={setOffice} placeholder="Set your office address" />
        </View>

        {previewing ? (
          <ActivityIndicator color={colors.accentDark} style={{ marginTop: space.sm }} />
        ) : previewError ? (
          <Text style={styles.error}>{previewError}</Text>
        ) : preview ? (
          <View style={[styles.previewCard, !preview.within_limit && styles.previewCardWarn]}>
            <Text style={styles.previewDistance}>
              {preview.distance_km.toFixed(1)} km · ~{preview.duration_min} min
            </Text>
            {preview.within_limit ? (
              <Text style={styles.previewOk}>Within this plan's {preview.max_km_per_trip} km limit</Text>
            ) : (
              <View style={styles.previewWarnRow}>
                <IconAlertTriangle size={16} color={colors.danger} strokeWidth={2} />
                <Text style={styles.previewWarnText}>
                  Your commute is {preview.excess_km.toFixed(1)} km above this plan's limit
                  {preview.extra_km_charge_per_trip > 0
                    ? ` — an extra ${rupees(preview.extra_km_charge_per_trip)}/trip applies.`
                    : '.'}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Commute days</Text>
        <View style={styles.chipWrap}>
          {COMMUTE_DAYS.map((d) => {
            const selected = days.includes(d);
            return (
              <Pressable
                key={d}
                onPress={() => toggleDay(d)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{DAY_LABEL[d]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Morning pickup</Text>
        <TimeChips value={pickupTime} onChange={setPickupTime} />
      </View>

      {roundTrip ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Evening return</Text>
          <TimeChips value={returnTime} onChange={setReturnTime} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{roundTrip ? '5' : '4'}. Review</Text>
        <View style={styles.card}>
          <ReviewRow label="Plan" value={`${plan.name} (${meta.label})`} />
          <ReviewRow label="Included rides" value={`${plan.included_rides} rides · ${plan.validity_days} days`} />
          <ReviewRow label="Schedule" value={days.length ? days.map((d) => DAY_LABEL[d]).join(', ') : 'Select days above'} />
          <ReviewRow label="Pickup" value={pickupTime ? fmtChip(pickupTime) : '—'} />
          {roundTrip ? <ReviewRow label="Return" value={returnTime ? fmtChip(returnTime) : '—'} /> : null}
          <View style={styles.reviewDivider} />
          <ReviewRow label="Monthly price" value={rupees(plan.monthly_price)} emphasis />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={submitting ? 'Activating…' : `Subscribe · ${rupees(plan.monthly_price)}/month`}
        onPress={submit}
        loading={submitting}
        disabled={!canSubmit}
      />
    </ScreenScaffold>
  );
}

function ReviewRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={[styles.reviewValue, emphasis && styles.reviewValueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  sectionTitle: { fontFamily: font.bold, fontSize: 13, color: colors.ink600 },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.md, gap: space.sm, borderWidth: 1, borderColor: colors.line100, ...shadow.card },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line200, backgroundColor: colors.white },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accentFaint },
  chipLabel: { fontFamily: font.semibold, fontSize: 12.5, color: colors.ink600 },
  chipLabelSelected: { color: colors.accentDark },
  previewCard: { backgroundColor: colors.accentTint, borderRadius: radius.control, padding: space.sm, gap: 4, marginTop: space.xs },
  previewCardWarn: { backgroundColor: '#FBE7E7' },
  previewDistance: { fontFamily: font.bold, fontSize: 13.5, color: colors.navy800 },
  previewOk: { fontFamily: font.medium, fontSize: 12, color: colors.accentDark },
  previewWarnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  previewWarnText: { fontFamily: font.medium, fontSize: 12, color: colors.danger, flex: 1, lineHeight: 17 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  reviewLabel: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink400, flexShrink: 0 },
  reviewValue: { fontFamily: font.semibold, fontSize: 12.5, color: colors.navy800, flexShrink: 1, textAlign: 'right' },
  reviewValueEmphasis: { fontFamily: font.extrabold, fontSize: 16, color: colors.navy800 },
  reviewDivider: { height: 1, backgroundColor: colors.line100, marginVertical: 2 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
});
