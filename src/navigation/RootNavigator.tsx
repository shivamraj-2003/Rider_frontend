import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import AuthNavigator from './AuthNavigator';
import PostAuthGate from './PostAuthGate';
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
      {/*
        Role gate. `user.role` comes from the backend session, never from
        anything the client picks — an admin always lands on AdminNavigator
        with no extra screen, and a customer or rider can never mount the
        admin tree by navigating (every /admin/* API is independently
        enforced server-side regardless). PostAuthGate reconciles the
        User/Rider choice made at login with that role before picking the
        actual navigator - see its own comment.
      */}
      {status !== 'signed-in' || !user ? <AuthNavigator /> : <PostAuthGate />}
    </NavigationContainer>
  );
}
