import React, { PropsWithChildren } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconLogout } from '@tabler/icons-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, font, radius, shadow, space } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
}

// Shared shell for role screens: header + sign-out action, so each screen
// only needs to render its own body content. Phase-1 tokens throughout, to
// match the polish of the booking flow rather than the app's older screens.
export default function ScreenScaffold({ title, subtitle, children }: PropsWithChildren<Props>) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + space.lg }]}
    >
      <View style={styles.header}>
        <View style={styles.headingBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable
          onPress={signOut}
          hitSlop={10}
          style={styles.signOut}
          accessibilityRole="button"
          accessibilityLabel={`Sign out (${user?.role})`}
        >
          <IconLogout size={19} color={colors.ink600} strokeWidth={1.75} />
        </Pressable>
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface50 },
  container: { flexGrow: 1, padding: space.xl, gap: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headingBlock: { gap: 3, flex: 1 },
  title: { fontFamily: font.extrabold, fontSize: 24, letterSpacing: -0.4, color: colors.navy800 },
  subtitle: { fontFamily: font.regular, fontSize: 13.5, color: colors.ink600 },
  signOut: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});
