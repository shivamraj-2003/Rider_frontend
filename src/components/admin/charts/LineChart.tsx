import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors } from '../../../theme';

interface Props {
  data: number[];
  height?: number;
  color?: string;
}

// Minimal sparkline-style line chart. No axes/labels — the surrounding
// SectionCard carries the title and any legend.
export default function LineChart({ data, height = 120, color = colors.accent }: Props) {
  const w = 320;
  const h = height;
  const pad = 8;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const points = data
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={f}
            x1={pad}
            x2={w - pad}
            y1={pad + f * (h - pad * 2)}
            y2={pad + f * (h - pad * 2)}
            stroke={colors.line100}
            strokeWidth={1}
          />
        ))}
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        {data.map((v, i) => {
          const x = pad + i * stepX;
          const y = pad + (1 - (v - min) / range) * (h - pad * 2);
          return <Circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width: '100%' } });
