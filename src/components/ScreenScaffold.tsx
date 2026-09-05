import React, { PropsWithChildren } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
}

// Shared shell for role screens: header + sign-out action, so each screen
// only needs to render its own body content.
export default function ScreenScaffold({ title, subtitle, children }: PropsWithChildren<Props>) {
  const { user, signOut } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable onPress={signOut} hitSlop={8}>
          <Text style={styles.signOut}>Sign out ({user?.role})</Text>
        </Pressable>
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  signOut: { ...typography.caption, color: colors.danger },
});
