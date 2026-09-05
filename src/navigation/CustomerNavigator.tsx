import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import RideHistoryScreen from '../screens/customer/RideHistoryScreen';
import AccountScreen from '../screens/customer/AccountScreen';
import DestinationSearchScreen from '../screens/customer/DestinationSearchScreen';
import RideSelectScreen from '../screens/customer/RideSelectScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import SearchingRiderScreen from '../screens/customer/SearchingRiderScreen';
import NoRidersFoundScreen from '../screens/customer/NoRidersFoundScreen';
import TrackRideScreen from '../screens/customer/TrackRideScreen';
import LocationPermissionScreen from '../screens/auth/LocationPermissionScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import { LOCATION_PROMPT_DONE_KEY } from '../constants/storage';
import type { BookingOut, FareEstimate, Place } from '../types';

export type CustomerStackParamList = {
  Tabs: undefined;
  DestinationSearch: { pickup: Place | null; drop?: Place | null };
  RideSelect: { pickup: Place; drop: Place };
  Payment: { pickup: Place; drop: Place; estimate: FareEstimate };
  SearchingRider: { booking: BookingOut; pickup: Place; drop: Place };
  NoRidersFound: { bookingId: string; pickup: Place; drop: Place };
  TrackRide: { bookingId: string };
};

export type CustomerTabParamList = {
  Book: undefined;
  History: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Book" component={CustomerHomeScreen} />
      <Tab.Screen name="History" component={RideHistoryScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function CustomerNavigator() {
  // One-time pre-permission explainer, gated ahead of the booking stack so a
  // new customer sees why location matters before the OS dialog. Riders have
  // their own in-context request when they go online, so this is customer-only.
  const [needsLocationPrompt, setNeedsLocationPrompt] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [done, perm] = await Promise.all([
          AsyncStorage.getItem(LOCATION_PROMPT_DONE_KEY),
          Location.getForegroundPermissionsAsync(),
        ]);
        setNeedsLocationPrompt(done !== '1' && perm.status === 'undetermined');
      } catch {
        setNeedsLocationPrompt(false);
      }
    })();
  }, []);

  if (needsLocationPrompt === null) return <SplashScreen />;

  if (needsLocationPrompt) {
    return (
      <LocationPermissionScreen
        onDone={() => {
          AsyncStorage.setItem(LOCATION_PROMPT_DONE_KEY, '1').catch(() => {});
          setNeedsLocationPrompt(false);
        }}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={CustomerTabs} />
      <Stack.Screen name="DestinationSearch" component={DestinationSearchScreen} />
      <Stack.Screen name="RideSelect" component={RideSelectScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="SearchingRider" component={SearchingRiderScreen} />
      <Stack.Screen name="NoRidersFound" component={NoRidersFoundScreen} />
      <Stack.Screen name="TrackRide" component={TrackRideScreen} />
    </Stack.Navigator>
  );
}
