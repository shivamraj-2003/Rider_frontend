import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../../theme';

interface Bar {
  label: string;
  value: number;
  color?: string;
}

// Pure-View horizontal-friendly vertical bar chart — no SVG needed, scales to
// container width. Good for "revenue by day" style series.
export default function BarChart({ data, height = 140 }: { data: Bar[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View>
      <View style={[styles.row, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.col}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max((d.value / max) * 100, 2)}%`,
                    backgroundColor: d.color ?? colors.accent,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.sm, minHeight: 3 },
  labels: { flexDirection: 'row', gap: 6, marginTop: 6 },
  label: { flex: 1, textAlign: 'center', fontFamily: font.medium, fontSize: 9, color: colors.ink400 },
});
