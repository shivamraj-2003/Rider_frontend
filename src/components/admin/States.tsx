import React from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { colors, font, radius, space } from '../../theme';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.dim}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errTitle}>Something went wrong</Text>
      <Text style={styles.dim}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.dim}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xxl, gap: space.sm },
  dim: { fontFamily: font.regular, fontSize: 13, color: colors.ink400, textAlign: 'center' },
  errTitle: { fontFamily: font.bold, fontSize: 15, color: colors.danger },
  emptyTitle: { fontFamily: font.bold, fontSize: 15, color: colors.navy800 },
  retry: {
    marginTop: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.navy800,
  },
  retryText: { fontFamily: font.bold, fontSize: 13, color: colors.white },
});
