import React, { PropsWithChildren } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface Props {
  title: string;
  subtitle?: string;
}

// Shared shell for role screens: header + sign-out action, so each screen
// only needs to render its own body content.
export default function ScreenScaffold({ title, subtitle, children }: PropsWithChildren<Props>) {
  const { user, signOut } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Sign out ({user?.role})</Text>
        </Pressable>
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  signOut: { fontSize: 12, color: '#c0392b' },
});
