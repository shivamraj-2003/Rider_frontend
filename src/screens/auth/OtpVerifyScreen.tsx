import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth, ApiError } from '../../context/AuthContext';
import { colors, type, font, radius, space } from '../../theme';
import Button from '../../components/Button';
import OtpInput from '../../components/OtpInput';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

const OTP_LENGTH = 6;

function prettyPhone(phone: string): string {
  return phone.replace(/^(\+91)(\d{5})(\d{5})$/, '$1 $2 $3');
}

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

  const handleVerify = async (value = code) => {
    if (value.length !== OTP_LENGTH || loading) {
      if (value.length !== OTP_LENGTH) setError('Enter the code you received');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const session = await verifyOtp(phone, value);
      if (!session.profile_complete) {
        navigation.replace('CompleteProfile');
      }
      // Otherwise AuthContext flips to "signed-in" and RootNavigator swaps automatically.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify code. Try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setError(null);
    setCode('');
    try {
      const { resend_in } = await sendOtp(phone);
      setSecondsLeft(resend_in);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code.');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.heading}>
          <Text style={type.screenTitle}>Verify your number</Text>
          <Text style={type.body}>
            Code sent to <Text style={styles.strong}>{prettyPhone(phone)}</Text>
          </Text>
        </View>

        <OtpInput
          value={code}
          onChangeText={(c) => {
            setCode(c);
            if (error) setError(null);
          }}
          onComplete={handleVerify}
          length={OTP_LENGTH}
          error={!!error}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.resendRow}>
          <Text style={styles.resendHint}>Didn't get the code?</Text>
          <Pressable onPress={handleResend} disabled={secondsLeft > 0} hitSlop={10}>
            <Text style={[styles.resend, secondsLeft === 0 && styles.resendActive]}>
              {secondsLeft > 0
                ? `Resend in 0:${String(secondsLeft).padStart(2, '0')}`
                : 'Resend code'}
            </Text>
          </Pressable>
        </View>

        <Button
          title={loading ? 'Verifying…' : 'Verify & continue'}
          onPress={() => handleVerify()}
          loading={loading}
          disabled={code.length !== OTP_LENGTH}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 28, paddingTop: 18, gap: space.xl },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.line200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: colors.navy800 },
  heading: { gap: space.sm },
  strong: { fontFamily: font.semibold, color: colors.navy800 },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger, marginTop: -space.md },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resendHint: { ...type.helper, fontSize: 14 },
  resend: { fontFamily: font.bold, fontSize: 14, color: colors.ink400, fontVariant: ['tabular-nums'] },
  resendActive: { color: colors.accentDark },
});
