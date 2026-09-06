import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius, shadow } from '../theme';

export default function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: 16,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  label: { fontFamily: font.semibold, fontSize: 11.5, letterSpacing: 0.3, color: colors.ink400, textTransform: 'uppercase' },
  value: { fontFamily: font.bold, fontSize: 16, color: colors.navy800, marginTop: 4 },
});
