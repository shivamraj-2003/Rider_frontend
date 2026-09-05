import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Icon } from '@tabler/icons-react-native';
import { colors, font, space } from '../../../theme';
import Button from '../../../components/Button';

// Shared full-screen status layout — same shape as NoRidersFoundScreen (§13),
// reused here for the four rider-verification terminal/waiting states so the
// whole app keeps one visual language for "here's where things stand".
export default function RiderStatusScreen({
  icon: IconComp,
  tint = 'accent',
  title,
  message,
  primaryLabel,
  onPrimary,
  primaryLoading,
  secondaryLabel,
  onSecondary,
}: {
  icon: Icon;
  tint?: 'accent' | 'danger' | 'success';
  title: string;
  message: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const iconColor = tint === 'danger' ? colors.danger : tint === 'success' ? colors.success : colors.accentDark;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <IconComp size={32} color={iconColor} strokeWidth={1.75} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{message}</Text>
      </View>

      <View style={styles.actions}>
        {primaryLabel && onPrimary ? (
          <Button title={primaryLabel} onPress={onPrimary} loading={primaryLoading} />
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Button title={secondaryLabel} variant="secondary" onPress={onSecondary} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  title: { fontFamily: font.extrabold, fontSize: 22, letterSpacing: -0.3, color: colors.navy800, textAlign: 'center' },
  sub: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink600,
    textAlign: 'center',
  },
  actions: { gap: space.sm },
});
