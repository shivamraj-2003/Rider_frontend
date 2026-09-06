import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { IconSearch, IconX } from '@tabler/icons-react-native';
import { colors, font, radius, space } from '../../theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Search…' }: Props) {
  return (
    <View style={styles.wrap}>
      <IconSearch size={18} color={colors.ink400} strokeWidth={2} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink400}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <IconX size={16} color={colors.ink400} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.line200,
    paddingHorizontal: space.md,
    height: 44,
  },
  input: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.navy800, padding: 0 },
});
