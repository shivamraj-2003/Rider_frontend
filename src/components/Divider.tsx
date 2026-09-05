import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, type } from '../theme';

interface Props {
  label?: string;
}

// Horizontal rule with an optional centered label.
export default function Divider({ label }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {label ? <View style={styles.line} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  line: { flex: 1, height: 1, backgroundColor: colors.line200 },
  label: { ...type.helper, fontSize: 13 },
});
