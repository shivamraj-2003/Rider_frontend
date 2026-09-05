import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, font, space } from '../../theme';
import Button from '../../components/Button';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'NoRidersFound'>;

// Terminal state for a booking that dispatch gave up on (§13). Offer a fresh
// pricing pass with the same pickup/drop, or a way back home.
export default function NoRidersFoundScreen({ navigation, route }: Props) {
  const { pickup, drop } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <View style={styles.iconInner} />
        </View>
        <Text style={styles.title}>No riders available</Text>
        <Text style={styles.sub}>
          We couldn&apos;t find a rider near your pickup right now. Try again in a moment.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Try again"
          onPress={() => navigation.replace('RideSelect', { pickup, drop })}
        />
        <Button
          title="Back to home"
          variant="secondary"
          onPress={() => navigation.navigate('Tabs')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  iconInner: { width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderColor: colors.accentDark },
  title: { fontFamily: font.extrabold, fontSize: 22, letterSpacing: -0.3, color: colors.navy800 },
  sub: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink600,
    textAlign: 'center',
  },
  actions: { gap: space.sm },
});
