import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, font, space } from '../../../theme';

export interface Slice {
  label: string;
  value: number;
  color: string;
}

// Ring chart with a centred total + a simple legend, matching the reference
// "Ride Overview" donut.
export default function DonutChart({ slices, centerLabel }: { slices: Slice[]; centerLabel?: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const size = 140;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  return (
    <View style={styles.wrap}>
      <View>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.line100}
            strokeWidth={stroke}
            fill="none"
          />
          {slices.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * circ;
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += dash;
            return el;
          })}
        </Svg>
        <View style={styles.center}>
          <Text style={styles.total}>{total}</Text>
          {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
            <Text style={styles.legendValue}>{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  total: { fontFamily: font.extrabold, fontSize: 22, color: colors.navy800 },
  centerLabel: { fontFamily: font.medium, fontSize: 10, color: colors.ink400 },
  legend: { flex: 1, gap: space.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontFamily: font.medium, fontSize: 12, color: colors.ink600 },
  legendValue: { fontFamily: font.bold, fontSize: 12, color: colors.navy800 },
});
