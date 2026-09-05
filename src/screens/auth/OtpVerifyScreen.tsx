import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth, ApiError } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export default function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone, resendIn } = route.params;
  const { sendOtp, verifyOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(resendIn);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const handleVerify = async () => {
    if (code.length < 4) {
      setError('Enter the code you received');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const session = await verifyOtp(phone, code);
      if (!session.profile_complete) {
        navigation.replace('CompleteProfile');
      }
      // Otherwise AuthContext flips to "signed-in" and RootNavigator swaps automatically.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const { resend_in } = await sendOtp(phone);
      setSecondsLeft(resend_in);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>Enter the code sent to {phone}</Text>

      <TextField
        placeholder="123456"
        keyboardType="number-pad"
        autoFocus
        maxLength={6}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        error={error}
      />

      <Button title="Verify & Continue" onPress={handleVerify} loading={loading} />

      <Pressable onPress={handleResend} disabled={secondsLeft > 0} style={styles.resendRow}>
        <Text style={[styles.resend, secondsLeft > 0 && styles.resendDisabled]}>
          {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  resendRow: { alignItems: 'center', marginTop: spacing.sm },
  resend: { ...typography.bodyStrong, color: colors.accent },
  resendDisabled: { color: colors.textSecondary },
});
