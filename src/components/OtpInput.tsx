import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, radius, font } from '../theme';

interface Props {
  value: string;
  onChangeText: (code: string) => void;
  onComplete?: (code: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
}

// N-cell OTP. One hidden input holds the real value; cells are display only.
// Fires onComplete(code) as soon as the last digit lands (SMS autofill included).
export default function OtpInput({
  value,
  onChangeText,
  onComplete,
  length = 6,
  error,
  autoFocus = true,
}: Props) {
  const ref = useRef<TextInput>(null);
  const cells = Array.from({ length });

  const handle = (t: string) => {
    const d = t.replace(/\D/g, '').slice(0, length);
    onChangeText(d);
    if (d.length === length) onComplete?.(d);
  };

  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      style={styles.row}
      accessibilityLabel="One-time code"
    >
      <TextInput
        ref={ref}
        value={value}
        onChangeText={handle}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        style={styles.hidden}
      />
      {cells.map((_, i) => {
        const char = value[i];
        const active = i === value.length;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              !!char && styles.cellFilled,
              active && styles.cellActive,
              error && styles.cellError,
            ]}
          >
            <Text style={styles.char}>{char || '–'}</Text>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  cell: {
    flex: 1,
    height: 64,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.line200,
    backgroundColor: colors.surface50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: { backgroundColor: colors.white, borderColor: colors.line200 },
  cellActive: { backgroundColor: colors.white, borderColor: colors.accent },
  cellError: { borderColor: colors.danger },
  char: {
    fontFamily: font.bold,
    fontSize: 24,
    color: colors.navy800,
    fontVariant: ['tabular-nums'],
  },
});
