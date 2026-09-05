import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, font, shadow } from '../theme';

type Variant = 'primary' | 'secondary' | 'navy';

interface Props extends Omit<PressableProps, 'style'> {
  title: string;
  // 'primary'  → orange CTA (default, matches the Phase 1 spec)
  // 'navy'     → navy filled button (secondary emphasis)
  // 'secondary'→ outline button
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const filled = variant === 'primary' || variant === 'navy';

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'navy' && styles.navy,
        variant === 'secondary' && styles.secondary,
        variant === 'primary' && !isDisabled && shadow.accent,
        isDisabled && filled && styles.disabled,
        isDisabled && !filled && styles.disabledOutline,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? colors.white : colors.navy800} />
      ) : (
        <Text
          style={[
            styles.label,
            filled ? styles.labelFilled : styles.labelOutline,
            isDisabled && styles.labelDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 58,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.accent },
  navy: { backgroundColor: colors.navy800 },
  secondary: {
    height: 56,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line200,
  },
  disabled: { backgroundColor: colors.line200 },
  disabledOutline: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  label: { fontFamily: font.bold, fontSize: 17 },
  labelFilled: { color: colors.white },
  labelOutline: { color: colors.ink600, fontFamily: font.semibold, fontSize: 16 },
  labelDisabled: { color: colors.ink400 },
});
