import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, radius, type, font } from '../theme';

interface Props {
  value: string; // raw digits, max 10
  onChangeText: (digits: string) => void;
  dialCode?: string;
  onPressDialCode?: () => void;
  autoFocus?: boolean;
}

// +91 chip + 10-digit field, displayed masked as "XXXXX XXXXX".
export default function PhoneField({
  value,
  onChangeText,
  dialCode = '+91',
  onPressDialCode,
  autoFocus,
}: Props) {
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const display = digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPressDialCode}
        disabled={!onPressDialCode}
        style={styles.dialCode}
        accessibilityRole="button"
        accessibilityLabel={`Country code ${dialCode}`}
      >
        <Text style={[type.label, styles.dialText]}>{dialCode}</Text>
      </Pressable>
      <View style={[styles.input, { borderColor: focused ? colors.navy800 : colors.line200 }]}>
        <TextInput
          value={display}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, '').slice(0, 10))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          autoFocus={autoFocus}
          maxLength={11}
          placeholder="98450 12488"
          placeholderTextColor={colors.ink400}
          selectionColor={colors.accent}
          style={styles.inputText}
          accessibilityLabel="Mobile number"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  dialCode: {
    height: 60,
    paddingHorizontal: 16,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.line200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialText: { fontSize: 16 },
  input: {
    flex: 1,
    height: 60,
    borderRadius: radius.input,
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  inputText: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: colors.navy800,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
});
