import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AvailabilityScreen from '../screens/rider/AvailabilityScreen';
import EarningsScreen from '../screens/rider/EarningsScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';
import RiderTripScreen from '../screens/rider/RiderTripScreen';

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
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={AvailabilityScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={RiderProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RiderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={RiderTabs} />
      <Stack.Screen name="RiderTrip" component={RiderTripScreen} />
    </Stack.Navigator>
  );
}
