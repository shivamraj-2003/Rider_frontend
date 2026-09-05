import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import { colors } from '../theme';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import RiderNavigator from './RiderNavigator';
import AdminNavigator from './AdminNavigator';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

// Single app, three roles (customer / rider / admin). Once signed in, wait
// for the first GET /config + crash-resume check (AppConfigProvider) before
// picking a home screen, so an in-progress ride is never missed on restart.
export default function RootNavigator() {
  const { status, user } = useAuth();
  const { initialized } = useAppConfig();

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'signed-in' && !initialized) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {status !== 'signed-in' || !user ? (
        <AuthNavigator />
      ) : user.role === 'customer' ? (
        <CustomerNavigator />
      ) : user.role === 'rider' ? (
        <RiderNavigator />
      ) : (
        <AdminNavigator />
      )}
    </NavigationContainer>
  );
}
