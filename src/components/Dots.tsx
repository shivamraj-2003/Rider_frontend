import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  count: number;
  index: number;
}

// Paging indicator — active dot elongates, inactive dots stay round.
export default function Dots({ count, index }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === index ? styles.active : styles.inactive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { height: 7, borderRadius: 4 },
  active: { width: 22, backgroundColor: colors.accent },
  inactive: { width: 7, backgroundColor: colors.line300 },
});
