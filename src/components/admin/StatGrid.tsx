import React, { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';
import { space } from '../../theme';

// 2-column wrapping row of StatCard.
export default function StatGrid({ children }: PropsWithChildren) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
