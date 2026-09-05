import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BookRideScreen from '../screens/customer/BookRideScreen';
import RideHistoryScreen from '../screens/customer/RideHistoryScreen';
import AccountScreen from '../screens/customer/AccountScreen';
import FareSelectScreen from '../screens/customer/FareSelectScreen';
import TrackRideScreen from '../screens/customer/TrackRideScreen';
import type { Place } from '../types';

export type CustomerStackParamList = {
  Tabs: undefined;
  FareSelect: { pickup: Place; drop: Place };
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
      <Tab.Screen name="Book" component={BookRideScreen} />
      <Tab.Screen name="History" component={RideHistoryScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={CustomerTabs} />
      <Stack.Screen name="FareSelect" component={FareSelectScreen} />
      <Stack.Screen name="TrackRide" component={TrackRideScreen} />
    </Stack.Navigator>
  );
}
