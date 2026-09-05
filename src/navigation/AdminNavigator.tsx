import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/admin/DashboardScreen';
import RidersScreen from '../screens/admin/RidersScreen';
import TripsScreen from '../screens/admin/TripsScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Riders" component={RidersScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
    </Tab.Navigator>
  );
}
