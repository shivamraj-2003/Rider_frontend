import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../theme';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_FOR: Record<string, Tone> = {
  // booking
  completed: 'success',
  in_progress: 'info',
  assigned: 'info',
  arrived: 'info',
  requested: 'warning',
  cancelled_by_customer: 'danger',
  cancelled_by_rider: 'danger',
  no_riders_found: 'danger',
  // rider
  approved: 'success',
  pending_verification: 'warning',
  suspended: 'danger',
  rejected: 'danger',
  // rider availability
  online: 'success',
  on_trip: 'info',
  offline: 'neutral',
  // payment
  paid: 'success',
  authorized: 'info',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
  // report / alert
  open: 'danger',
  reviewing: 'warning',
  actioned: 'success',
  dismissed: 'neutral',
  resolved: 'success',
  // offer
  active: 'success',
  inactive: 'neutral',
};

const LABELS: Record<string, string> = {
  in_progress: 'In progress',
  pending_verification: 'Pending',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_rider: 'Cancelled',
  no_riders_found: 'No riders',
  on_trip: 'On trip',
};

const PALETTE: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: '#E4F5EC', fg: colors.success },
  warning: { bg: '#FDF1E7', fg: colors.accentDark },
  danger: { bg: '#FBE7E7', fg: colors.danger },
  info: { bg: '#E7EEF6', fg: colors.navy600 },
  neutral: { bg: colors.surface100, fg: colors.ink600 },
};

export function statusLabel(status: string) {
  return LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export default function StatusBadge({ status, tone }: { status: string; tone?: Tone }) {
  const resolved = tone ?? TONE_FOR[status] ?? 'neutral';
  const c = PALETTE[resolved];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' },
  text: { fontFamily: font.bold, fontSize: 11 },
});
