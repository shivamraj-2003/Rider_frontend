import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import RiderNavigator from './RiderNavigator';
import AdminNavigator from './AdminNavigator';
import SplashScreen from '../screens/auth/SplashScreen';

const MIN_SPLASH_MS = 1200;

// Single app, three roles (customer / rider / admin). Once signed in, wait
// for the first GET /config + crash-resume check (AppConfigProvider) before
// picking a home screen, so an in-progress ride is never missed on restart.
export default function RootNavigator({ fontsReady = true }: { fontsReady?: boolean }) {
  const { status, user } = useAuth();
  const { initialized } = useAppConfig();

  // The splash holds for at least MIN_SPLASH_MS regardless of how fast the
  // session restore / font load resolves.
  const [minHoldElapsed, setMinHoldElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinHoldElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const bootstrapping =
    !fontsReady || status === 'loading' || (status === 'signed-in' && !initialized);

  if (bootstrapping || !minHoldElapsed) return <SplashScreen />;

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
