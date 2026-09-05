import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
  },
  label: { fontSize: 12, color: '#888' },
  value: { fontSize: 16, fontWeight: '600', marginTop: 4 },
});
