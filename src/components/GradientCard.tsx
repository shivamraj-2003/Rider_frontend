import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme';

// A navy "hero" card with real depth — a diagonal two-tone gradient plus a
// soft glass highlight along the top edge — instead of one flat fill. Used
// wherever a screen wants its headline stat/status to feel raised off the
// page (rider Home, Earnings, trip status) rather than a plain filled rect.
// Colours stay inside the existing navy/accent palette; no new tokens.
export default function GradientCard({
  children,
  style,
  tones = [colors.navy600, colors.navy900],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tones?: [string, string];
}) {
  return (
    <View style={styles.shadowWrap}>
      <View style={[styles.clip, style]}>
        <LinearGradient
          colors={tones}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.7 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: radius.card, ...shadow.card },
  clip: { borderRadius: radius.card, overflow: 'hidden' },
});
