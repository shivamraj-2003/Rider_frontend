import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BookRideScreen from '../screens/customer/BookRideScreen';
import RideHistoryScreen from '../screens/customer/RideHistoryScreen';
import AccountScreen from '../screens/customer/AccountScreen';

const Tab = createBottomTabNavigator();

export default function CustomerNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Book" component={BookRideScreen} />
      <Tab.Screen name="History" component={RideHistoryScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
