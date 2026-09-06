import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconCar, IconSteeringWheel } from '@tabler/icons-react-native';
import { useAuth, ApiError } from '../../context/AuthContext';
import type { IntendedRole } from '../../context/AuthContext';
import { colors, type, font, radius, space } from '../../theme';
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
  const { sendOtp, intendedRole, setIntendedRole } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const role: IntendedRole = intendedRole ?? 'customer';

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
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.lockup}
            resizeMode="contain"
            accessibilityLabel="Top Rider"
          />

          <View style={styles.roleToggle}>
            <RoleTab
              icon={IconCar}
              label="User"
              selected={role === 'customer'}
              onPress={() => setIntendedRole('customer')}
            />
            <RoleTab
              icon={IconSteeringWheel}
              label="Rider"
              selected={role === 'rider'}
              onPress={() => setIntendedRole('rider')}
            />
          </View>

          <View style={styles.heading}>
            <Text style={type.screenTitle}>Enter your mobile number</Text>
            <Text style={type.body}>
              {role === 'rider'
                ? "We'll text a 6-digit code, then take you to your rider dashboard."
                : "We'll text a 6-digit code to verify it's you."}
            </Text>
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

function RoleTab({
  icon: Icon,
  label,
  selected,
  onPress,
}: {
  icon: typeof IconCar;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.roleTab, selected && styles.roleTabSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Icon size={17} color={selected ? colors.white : colors.ink600} strokeWidth={1.9} />
      <Text style={[styles.roleTabLabel, selected && styles.roleTabLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  body: { paddingHorizontal: 28, paddingTop: 18, gap: space.xxl },
  lockup: { width: 96, height: 96, alignSelf: 'center' },
  roleToggle: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: radius.control,
    backgroundColor: colors.surface100,
    alignSelf: 'flex-start',
  },
  roleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.control - 4,
  },
  roleTabSelected: { backgroundColor: colors.navy800 },
  roleTabLabel: { fontFamily: font.bold, fontSize: 14, color: colors.ink600 },
  roleTabLabelSelected: { color: colors.white },
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
