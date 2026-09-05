import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconLayoutDashboard, IconUserCircle, IconWallet } from '@tabler/icons-react-native';
import AvailabilityScreen from '../screens/rider/AvailabilityScreen';
import EarningsScreen from '../screens/rider/EarningsScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';
import RiderTripScreen from '../screens/rider/RiderTripScreen';
import VerificationPendingScreen from '../screens/rider/status/VerificationPendingScreen';
import RiderRejectedScreen from '../screens/rider/status/RiderRejectedScreen';
import RiderSuspendedScreen from '../screens/rider/status/RiderSuspendedScreen';
import RiderApprovedScreen from '../screens/rider/status/RiderApprovedScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import { getRiderMe } from '../services/rider';
import { colors } from '../theme';
import type { RiderMe, RiderStatus } from '../types';

export type RiderStackParamList = {
  Tabs: undefined;
  RiderTrip: { bookingId: string };
};

export type RiderTabParamList = {
  Home: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RiderTabParamList>();
const Stack = createNativeStackNavigator<RiderStackParamList>();

function RiderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink400,
      }}
    >
      <Tab.Screen
        name="Home"
        component={AvailabilityScreen}
        options={{ tabBarIcon: ({ color, size }) => <IconLayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarIcon: ({ color, size }) => <IconWallet color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={RiderProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <IconUserCircle color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

// Gate in front of the rider dashboard: a `role === 'rider'` account can
// still be pending/rejected/suspended (RiderProfile.status is independent of
// User.role — onboarding flips role immediately, verification is separate).
// Never assume approval on the frontend — always ask GET /riders/me.
export default function RiderNavigator() {
  const [riderMe, setRiderMe] = useState<RiderMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [justApproved, setJustApproved] = useState(false);
  const previousStatus = useRef<RiderStatus | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const me = await getRiderMe();
      if (previousStatus.current === 'pending_verification' && me.status === 'approved') {
        setJustApproved(true);
      }
      previousStatus.current = me.status;
      setRiderMe(me);
    } catch {
      setRiderMe(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SplashScreen />;

  if (!riderMe) {
    // role flipped to 'rider' without ever onboarding (e.g. an admin edit) —
    // fail safe instead of crashing on a dashboard that expects a profile.
    return <RiderRejectedScreen />;
  }

  if (riderMe.status === 'pending_verification') {
    return <VerificationPendingScreen onRefresh={load} refreshing={refreshing} />;
  }
  if (riderMe.status === 'rejected') return <RiderRejectedScreen />;
  if (riderMe.status === 'suspended') return <RiderSuspendedScreen />;

  if (justApproved) {
    return <RiderApprovedScreen onContinue={() => setJustApproved(false)} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={RiderTabs} />
      <Stack.Screen name="RiderTrip" component={RiderTripScreen} />
    </Stack.Navigator>
  );
}
