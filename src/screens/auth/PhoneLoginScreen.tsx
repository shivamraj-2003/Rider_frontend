import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth, ApiError } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

// India-only for now: user types the 10-digit number, we add the country code.
function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 10) return null;
  return `+91${digits}`;
}

export default function PhoneLoginScreen({ navigation }: Props) {
  const { sendOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const e164 = toE164(phone);
    if (!e164) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { expires_in, resend_in } = await sendOtp(e164);
      navigation.navigate('OtpVerify', { phone: e164, expiresIn: expires_in, resendIn: resend_in });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.brand}>
          <Image source={require('../../../assets/logo.jpeg')} style={styles.logo} />
          <Text style={styles.title}>Top Rider</Text>
          <Text style={styles.tagline}>Ride Safe. Reach Home.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Enter your mobile number</Text>
          <TextField
            placeholder="98765 43210"
            keyboardType="phone-pad"
            autoFocus
            maxLength={10}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            error={error}
          />
          <Button title="Continue" onPress={handleContinue} loading={loading} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  brand: { alignItems: 'center', gap: spacing.xs },
  logo: { width: 96, height: 96, resizeMode: 'contain' },
  title: { ...typography.h1, color: colors.primary, marginTop: spacing.sm },
  tagline: { ...typography.caption, color: colors.textSecondary },
  form: { gap: spacing.lg },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
});
