import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import { useAuth } from '../context/AuthContext';
import { ONBOARDING_SEEN_KEY } from '../constants/storage';

export type AuthStackParamList = {
  Onboarding: undefined;
  PhoneLogin: undefined;
  OtpVerify: { phone: string; expiresIn: number; resendIn: number };
  CompleteProfile: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// A phone that already verified but never finished their name (status
// "needs-profile") should land straight on CompleteProfile, not re-enter
// their number. A first-time visitor sees the onboarding carousel once
// (persisted in AsyncStorage), then never again.
export default function AuthNavigator() {
  const { status } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then((v) => setOnboardingSeen(v === '1'))
      .catch(() => setOnboardingSeen(true));
  }, []);

  if (status !== 'needs-profile' && onboardingSeen === null) return <SplashScreen />;

  const initialRouteName =
    status === 'needs-profile' ? 'CompleteProfile' : onboardingSeen ? 'PhoneLogin' : 'Onboarding';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    </Stack.Navigator>
  );
}
