import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconArrowLeft, IconClock, IconCoin, IconSteeringWheel } from '@tabler/icons-react-native';
import { colors, font, radius, space } from '../../../theme';
import Button from '../../../components/Button';
import type { BecomeRiderStackParamList } from '../../../navigation/BecomeRiderNavigator';

type Props = NativeStackScreenProps<BecomeRiderStackParamList, 'Intro'>;

const BENEFITS = [
  { icon: IconClock, title: 'Flexible working', body: 'Go online whenever suits you — no fixed shifts.' },
  { icon: IconCoin, title: 'Earn more', body: 'Keep every fare after a transparent commission.' },
  { icon: IconSteeringWheel, title: 'Use your own vehicle', body: 'Bike, auto, or car — bring what you already have.' },
];

export default function BecomeRiderIntroScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <IconArrowLeft size={20} color={colors.navy800} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Become a Rider</Text>
        <Text style={styles.subtitle}>Turn your bike, auto, or car into an income — on your schedule.</Text>

        <View style={styles.benefits}>
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <View key={title} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Icon size={24} color={colors.accentDark} strokeWidth={1.75} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{title}</Text>
                <Text style={styles.benefitBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Get Started" onPress={() => navigation.navigate('VehicleDetails')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  headerRow: { paddingHorizontal: 28, paddingTop: 18 },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.line200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: space.xl, gap: space.xl },
  title: { fontFamily: font.extrabold, fontSize: 27, letterSpacing: -0.5, color: colors.navy800 },
  subtitle: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.ink600 },
  benefits: { gap: space.lg, marginTop: space.md },
  benefitRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.tile,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: { flex: 1, gap: 2 },
  benefitTitle: { fontFamily: font.bold, fontSize: 16, color: colors.navy800 },
  benefitBody: { fontFamily: font.regular, fontSize: 13.5, lineHeight: 20, color: colors.ink600 },
  footer: { paddingHorizontal: 28, paddingBottom: space.lg },
});
