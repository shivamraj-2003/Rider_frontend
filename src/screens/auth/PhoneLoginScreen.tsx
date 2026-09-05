import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth, ApiError } from '../../context/AuthContext';
import { colors, type, font, space } from '../../theme';
import Button from '../../components/Button';
import PhoneField from '../../components/PhoneField';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

const TERMS_URL = 'https://toprider.app/terms';
const PRIVACY_URL = 'https://toprider.app/privacy';

// India-only for now: user types the 10-digit number, we add the country code.
function toE164(digits: string): string | null {
  return digits.length === 10 ? `+91${digits}` : null;
}

export default function PhoneLoginScreen({ navigation }: Props) {
  const { sendOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const valid = phone.length === 10;

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
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Image source={require('../../../assets/logo.png')} style={styles.lockup} resizeMode="contain" />

          <View style={styles.heading}>
            <Text style={type.screenTitle}>Enter your mobile number</Text>
            <Text style={type.body}>We'll text a 6-digit code to verify it's you.</Text>
          </View>

          <PhoneField
            value={phone}
            onChangeText={(d) => {
              setPhone(d);
              if (error) setError(null);
            }}
            dialCode="+91"
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={loading ? 'Sending…' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
            disabled={!valid}
          />
        </View>

        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms
          </Text>{' '}
          and{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
          .
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  body: { paddingHorizontal: 28, paddingTop: 18, gap: space.xxl },
  lockup: { width: 96, height: 96, alignSelf: 'flex-start' },
  heading: { gap: space.sm },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger, marginTop: -space.md },
  legal: {
    marginTop: 'auto',
    paddingHorizontal: 34,
    paddingBottom: 24,
    textAlign: 'center',
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 20,
    color: colors.ink400,
  },
  legalLink: { fontFamily: font.semibold, color: colors.navy800 },
});
