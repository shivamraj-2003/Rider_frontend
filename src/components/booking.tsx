import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, type, radius, shadow, font } from '../theme';
import { rupees } from '../types';

// Booking-flow UI primitives (Phase 2). Grouped in one file because they are
// only used together across the five booking screens; the app's generic
// Button / PhoneField / TextField stay in their own files.
//
// Selected state everywhere: orange border (colors.accent) + faint orange fill
// (colors.accentFaint). Fares / distances / durations use tabular numerals.

export function Sheet({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.sheet, style]}>
      <View style={s.grab} />
      {children}
    </View>
  );
}

export function Badge({
  label,
  variant = 'accent',
}: {
  label: string;
  variant?: 'accent' | 'outline';
}) {
  const outline = variant === 'outline';
  return (
    <View style={[s.badge, outline ? s.badgeOutline : s.badgeAccent]}>
      <Text style={[s.badgeLabel, outline && s.badgeLabelOutline]}>{label}</Text>
    </View>
  );
}

// TODO(phase-2): replace the text glyph with real vehicle / payment artwork.
export function GlyphTile({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: 'accent' | 'muted' | 'dark';
}) {
  const bg =
    tone === 'accent' ? colors.accentTint : tone === 'dark' ? colors.navy800 : colors.surface100;
  const fg =
    tone === 'accent' ? colors.accentDark : tone === 'dark' ? colors.white : colors.navy600;
  return (
    <View style={[s.glyphTile, { backgroundColor: bg }]}>
      <Text style={[s.glyph, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function VehicleRow({
  label,
  glyph,
  meta,
  fare,
  strikeFare,
  badge,
  selected,
  onPress,
}: {
  label: string;
  glyph: string;
  meta: string;
  fare: number;
  strikeFare?: number;
  badge?: { label: string; variant?: 'accent' | 'outline' };
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        s.row,
        selected && s.rowSelected,
        pressed && !selected && s.rowPressed,
      ]}
    >
      <GlyphTile label={glyph} tone={selected ? 'accent' : 'muted'} />
      <View style={s.rowBody}>
        <View style={s.rowTitleLine}>
          <Text style={s.rowLabel} numberOfLines={1}>
            {label}
          </Text>
          {badge ? <Badge label={badge.label} variant={badge.variant} /> : null}
        </View>
        <Text style={s.rowMeta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={s.fareCol}>
        <Text style={s.fare}>{rupees(fare)}</Text>
        {strikeFare ? <Text style={s.strike}>{rupees(strikeFare)}</Text> : null}
      </View>
    </Pressable>
  );
}

export function PaymentRow({
  label,
  sub,
  glyph,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  sub: string;
  glyph: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[s.row, selected && s.rowSelected, disabled && s.rowDisabled]}
    >
      <GlyphTile label={glyph} tone={selected ? 'dark' : 'muted'} />
      <View style={s.rowBody}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowMeta}>{sub}</Text>
      </View>
      <View style={[s.radio, selected && s.radioOn]}>
        {selected ? <View style={s.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

export function FareBreakdown({
  rows,
  total,
  note,
}: {
  rows: { label: string; value: string; discount?: boolean }[];
  total: number;
  note?: string;
}) {
  return (
    <View style={s.breakdown}>
      {rows.map((r) => (
        <View key={r.label} style={s.breakRow}>
          <Text style={[s.breakLabel, r.discount && s.discount]}>{r.label}</Text>
          <Text style={[s.breakValue, r.discount && s.discount]}>{r.value}</Text>
        </View>
      ))}
      <View style={s.hr} />
      <View style={s.breakRow}>
        <Text style={s.totalLabel}>Estimated total</Text>
        <Text style={s.totalValue}>{rupees(total)}</Text>
      </View>
      {note ? <Text style={s.note}>{note}</Text> : null}
    </View>
  );
}

export function PlaceRow({
  name,
  address,
  distanceKm,
  saved,
  onPress,
}: {
  name: string;
  address: string;
  distanceKm?: number;
  saved?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.placeRow, pressed && s.rowPressed]}
    >
      <View style={[s.placeIcon, saved && s.placeIconSaved]}>
        <View style={saved ? s.placeStar : s.placeRing} />
      </View>
      <View style={s.rowBody}>
        <Text style={s.rowLabel} numberOfLines={1}>
          {name}
        </Text>
        <Text style={s.rowMeta} numberOfLines={1}>
          {address}
        </Text>
      </View>
      {distanceKm != null ? <Text style={s.dist}>{distanceKm.toFixed(1)} km</Text> : null}
    </Pressable>
  );
}

export function SavedPlaceCard({
  label,
  name,
  eta,
  onPress,
}: {
  label: string;
  name: string;
  eta?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={s.savedCard}>
      <Text style={s.savedLabel}>{label.toUpperCase()}</Text>
      <Text style={s.savedName} numberOfLines={1}>
        {name}
      </Text>
      {eta ? <Text style={s.rowMeta}>{eta}</Text> : null}
    </Pressable>
  );
}

// From/to rail: navy dot → line → orange square.
export function TripRail({
  pickup,
  drop,
  onPressPickup,
  onPressDrop,
}: {
  pickup: string;
  drop: string;
  onPressPickup?: () => void;
  onPressDrop?: () => void;
}) {
  return (
    <View style={s.rail}>
      <View style={s.railDots}>
        <View style={s.dotNavy} />
        <View style={s.railLine} />
        <View style={s.dotAccent} />
      </View>
      <View style={s.railBody}>
        <Pressable onPress={onPressPickup} disabled={!onPressPickup}>
          <Text style={[s.railText, s.railTop]} numberOfLines={1}>
            {pickup}
          </Text>
        </Pressable>
        <Pressable onPress={onPressDrop} disabled={!onPressDrop}>
          <Text style={s.railText} numberOfLines={1}>
            {drop || 'Enter destination'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 16,
    ...shadow.sheet,
  },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line300, alignSelf: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.line100,
    backgroundColor: colors.white,
  },
  rowSelected: { borderColor: colors.accent, backgroundColor: colors.accentFaint },
  rowPressed: { backgroundColor: colors.surface50 },
  rowDisabled: { opacity: 0.45 },
  rowBody: { flex: 1, gap: 3 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontFamily: font.bold, fontSize: 16, color: colors.navy800 },
  rowMeta: { fontFamily: font.regular, fontSize: 12.5, color: colors.ink600 },
  fareCol: { alignItems: 'flex-end', gap: 2 },
  fare: { fontFamily: font.extrabold, fontSize: 18, color: colors.navy800, fontVariant: ['tabular-nums'] },
  strike: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.ink400,
    textDecorationLine: 'line-through',
    fontVariant: ['tabular-nums'],
  },
  glyphTile: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: font.bold, fontSize: 11, letterSpacing: 0.5 },
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.pill },
  badgeAccent: { backgroundColor: colors.accent },
  badgeOutline: { borderWidth: 1, borderColor: colors.navy800 },
  badgeLabel: { fontFamily: font.bold, fontSize: 9.5, letterSpacing: 0.6, color: colors.white },
  badgeLabelOutline: { color: colors.navy800 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.line300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  breakdown: { backgroundColor: colors.surface50, borderRadius: radius.control, padding: 16, gap: 10 },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakLabel: { fontFamily: font.regular, fontSize: 14, color: colors.ink600 },
  breakValue: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.navy800,
    fontVariant: ['tabular-nums'],
  },
  discount: { color: colors.accentDark },
  hr: { height: 1, backgroundColor: colors.line200 },
  totalLabel: { fontFamily: font.bold, fontSize: 15, color: colors.navy800 },
  totalValue: {
    fontFamily: font.extrabold,
    fontSize: 22,
    color: colors.navy800,
    fontVariant: ['tabular-nums'],
  },
  note: { ...type.helper, fontSize: 12 },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line100,
  },
  placeIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.tile,
    backgroundColor: colors.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeIconSaved: { backgroundColor: colors.accentTint },
  placeRing: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.ink600 },
  placeStar: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.accentDark },
  dist: { fontFamily: font.medium, fontSize: 12, color: colors.ink400, fontVariant: ['tabular-nums'] },
  savedCard: { flex: 1, borderRadius: 16, backgroundColor: colors.surface50, padding: 14, gap: 6 },
  savedLabel: { fontFamily: font.medium, fontSize: 10, letterSpacing: 1.2, color: colors.ink400 },
  savedName: { fontFamily: font.semibold, fontSize: 13.5, color: colors.navy800 },
  rail: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line200,
    padding: 16,
  },
  railDots: { alignItems: 'center', paddingTop: 6, gap: 4 },
  railBody: { flex: 1, gap: 12 },
  dotNavy: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.navy800 },
  dotAccent: { width: 9, height: 9, borderRadius: 2, backgroundColor: colors.accent },
  railLine: { width: 1.5, height: 30, backgroundColor: colors.line300 },
  railText: { fontFamily: font.semibold, fontSize: 15, color: colors.navy800 },
  railTop: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line100 },
});
