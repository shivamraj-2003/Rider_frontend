import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen';
import { useAuth } from '../context/AuthContext';

export type AuthStackParamList = {
  PhoneLogin: undefined;
  OtpVerify: { phone: string; expiresIn: number; resendIn: number };
  CompleteProfile: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// A phone that already verified but never finished their name (status
// "needs-profile") should land straight on CompleteProfile, not re-enter
// their number.
export default function AuthNavigator() {
  const { status } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={status === 'needs-profile' ? 'CompleteProfile' : 'PhoneLogin'}
    >
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    </Stack.Navigator>
  );
}
