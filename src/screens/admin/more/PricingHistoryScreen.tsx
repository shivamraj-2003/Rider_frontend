import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AdminScreen from '../../../components/admin/AdminScreen';
import SectionCard from '../../../components/admin/SectionCard';
import ListRow from '../../../components/admin/ListRow';
import { LoadingState, ErrorState, EmptyState } from '../../../components/admin/States';
import { useAdminQuery } from '../../../components/admin/useAdminQuery';
import { dateTime, titleCase } from '../../../components/admin/format';
import * as adminApi from '../../../services/admin';
import { colors, font } from '../../../theme';
import { VEHICLE_META } from '../../../types';
import type { VehicleType } from '../../../types';
import type { AuditLogRow } from '../../../types/admin';

// Fields worth calling out when they change — money/percent/status, not
// every internal key (there's nothing interesting about restating fields
// that didn't move).
const TRACKED_FIELDS: { key: string; label: string; isMoney?: boolean }[] = [
  { key: 'tier1_km', label: 'Short-hop distance (km)' },
  { key: 'tier1_fare', label: 'Short-hop fare', isMoney: true },
  { key: 'tier2_km', label: 'Flat-fare distance (km)' },
  { key: 'base_fare', label: 'Flat fare', isMoney: true },
  { key: 'per_km_rate', label: 'Rate/km beyond', isMoney: true },
  { key: 'per_minute_rate', label: 'Rate/min', isMoney: true },
  { key: 'minimum_fare', label: 'Minimum fare', isMoney: true },
  { key: 'commission_percent', label: 'Company commission' },
  { key: 'cancellation_fee', label: 'Cancellation fee', isMoney: true },
  { key: 'waiting_charge_per_minute', label: 'Waiting charge/min', isMoney: true },
  { key: 'surge_multiplier', label: 'Surge multiplier' },
  { key: 'is_active', label: 'Active' },
];

function fmt(v: unknown, isMoney?: boolean): string {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (isMoney) return `₹${v}`;
  if (typeof v === 'number' && (v as number) <= 100) return `${v}%`;
  return String(v);
}

// Summarises exactly what changed between two PricingRuleOut snapshots —
// this is what turns a bare audit row into "Rate/km: ₹10 → ₹12" instead of
// a wall of JSON.
function describeChange(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string {
  if (!before) return 'Created with the values shown when opened';
  if (!after) return 'No changes recorded';
  const diffs: string[] = [];
  for (const f of TRACKED_FIELDS) {
    if (before[f.key] !== after[f.key]) {
      diffs.push(`${f.label}: ${fmt(before[f.key], f.isMoney)} → ${fmt(after[f.key], f.isMoney)}`);
    }
  }
  return diffs.length ? diffs.join(' · ') : 'Saved with no field changes';
}

function vehicleLabel(entityId: string | null): string {
  if (!entityId) return 'Pricing';
  const meta = VEHICLE_META[entityId as VehicleType];
  return meta ? meta.label : entityId;
}

export default function PricingHistoryScreen() {
  const fetcher = useCallback(
    () => adminApi.getAuditLogs({ entity_type: 'pricing_rule', limit: 100 }),
    []
  );
  const { data, loading, error, refreshing, onRefresh, refetch } = useAdminQuery(fetcher);

  return (
    <AdminScreen title="Pricing History" refreshing={refreshing} onRefresh={onRefresh}>
      {loading && !data ? (
        <LoadingState />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No pricing changes yet" hint="Every edit to a rate card shows up here." />
      ) : (
        <SectionCard padded={false}>
          {data.map((log: AuditLogRow, i) => (
            <ListRow
              key={log.id}
              title={`${titleCase(log.action)} · ${vehicleLabel(log.entity_id)}`}
              subtitle={`${dateTime(log.created_at)} — ${describeChange(log.before, log.after)}`}
              divider={i < data.length - 1}
            />
          ))}
        </SectionCard>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Append-only — nothing here can be edited or removed, including by an admin.
        </Text>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  footer: { paddingTop: 4 },
  footerText: { fontFamily: font.regular, fontSize: 11, color: colors.ink400, textAlign: 'center' },
});
