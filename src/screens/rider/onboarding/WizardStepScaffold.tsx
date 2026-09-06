import React, { PropsWithChildren } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { colors, font, radius, space } from '../../../theme';
import Dots from '../../../components/Dots';
import Button from '../../../components/Button';

// Shared shell for the 5-step Become-a-Rider wizard — same back-button /
// heading / footer-button structure as the auth screens (OtpVerify,
// CompleteProfile), plus the existing `Dots` progress indicator.
export default function WizardStepScaffold({
  title,
  subtitle,
  step,
  totalSteps = 5,
  onBack,
  nextLabel = 'Continue',
  onNext,
  nextLoading,
  nextDisabled,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  step: number;
  totalSteps?: number;
  onBack: () => void;
  nextLabel?: string;
  onNext: () => void;
  nextLoading?: boolean;
  nextDisabled?: boolean;
}>) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Pressable onPress={onBack} style={styles.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
              <IconArrowLeft size={20} color={colors.navy800} strokeWidth={2} />
            </Pressable>
            <Dots count={totalSteps} index={step} />
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>

          <View style={styles.body}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title={nextLabel} onPress={onNext} loading={nextLoading} disabled={nextDisabled} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 28, paddingTop: 18, gap: space.xl, flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.line200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { gap: space.sm },
  title: { fontFamily: font.extrabold, fontSize: 24, letterSpacing: -0.4, color: colors.navy800 },
  subtitle: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: colors.ink600 },
  body: { gap: space.lg, flex: 1 },
  footer: { paddingHorizontal: 28, paddingBottom: space.lg },
});
