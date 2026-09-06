import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, radius, space } from '../../theme';

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
  onPress?: () => void;
}

export default function StatCard({ label, value, delta, deltaTone = 'up', onPress }: Props) {
  const Container: any = onPress ? Pressable : View;
  return (
    <Container style={styles.card} onPress={onPress}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      {delta ? (
        <Text
          style={[
            styles.delta,
            deltaTone === 'up' && styles.up,
            deltaTone === 'down' && styles.down,
          ]}
        >
          {delta}
        </Text>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line100,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    gap: 4,
  },
  label: { fontFamily: font.semibold, fontSize: 12, color: colors.ink600 },
  value: { fontFamily: font.extrabold, fontSize: 22, color: colors.navy800, letterSpacing: -0.5 },
  delta: { fontFamily: font.bold, fontSize: 11, color: colors.ink400 },
  up: { color: colors.success },
  down: { color: colors.danger },
});
