import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { IconHistory, IconHome, IconUserCircle } from '@tabler/icons-react-native';
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import RideHistoryScreen from '../screens/customer/RideHistoryScreen';
import AccountScreen from '../screens/customer/AccountScreen';
import DestinationSearchScreen from '../screens/customer/DestinationSearchScreen';
import RideSelectScreen from '../screens/customer/RideSelectScreen';
import PaymentScreen from '../screens/customer/PaymentScreen';
import SearchingRiderScreen from '../screens/customer/SearchingRiderScreen';
import NoRidersFoundScreen from '../screens/customer/NoRidersFoundScreen';
import TrackRideScreen from '../screens/customer/TrackRideScreen';
import RateRideScreen from '../screens/customer/RateRideScreen';
import SavedPlacesScreen from '../screens/customer/SavedPlacesScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import EmergencyContactsScreen from '../screens/customer/EmergencyContactsScreen';
import CommuteSubscriptionScreen from '../screens/customer/subscription/CommuteSubscriptionScreen';
import SubscribeCommuteScreen from '../screens/customer/subscription/SubscribeCommuteScreen';
import SubscriptionHistoryScreen from '../screens/customer/subscription/SubscriptionHistoryScreen';
import LocationPermissionScreen from '../screens/auth/LocationPermissionScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import { LOCATION_PROMPT_DONE_KEY } from '../constants/storage';
import { colors } from '../theme';
import type { BookingOut, FareEstimate, Place } from '../types';

export type CustomerStackParamList = {
  Tabs: undefined;
  DestinationSearch: { pickup: Place | null; drop?: Place | null };
  RideSelect: { pickup: Place; drop: Place };
  Payment: { pickup: Place; drop: Place; estimate: FareEstimate };
  SearchingRider: { booking: BookingOut; pickup: Place; drop: Place };
  NoRidersFound: { bookingId: string; pickup: Place; drop: Place };
  TrackRide: { bookingId: string };
  RateRide: { bookingId: string };
  SavedPlaces: undefined;
  Notifications: undefined;
  EmergencyContacts: undefined;
  CommuteSubscription: undefined;
  SubscribeCommute: { planId: string };
  SubscriptionHistory: undefined;
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
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink400,
      }}
    >
      <Tab.Screen
        name="Book"
        component={CustomerHomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <IconHome color={color} size={size} /> }}
      />
      <Tab.Screen
        name="History"
        component={RideHistoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <IconHistory color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <IconUserCircle color={color} size={size} /> }}
      />
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
      <Stack.Screen name="RateRide" component={RateRideScreen} />
      <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="CommuteSubscription" component={CommuteSubscriptionScreen} />
      <Stack.Screen name="SubscribeCommute" component={SubscribeCommuteScreen} />
      <Stack.Screen name="SubscriptionHistory" component={SubscriptionHistoryScreen} />
    </Stack.Navigator>
  );
}
