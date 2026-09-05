import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import CustomerNavigator from './CustomerNavigator';
import RiderNavigator from './RiderNavigator';
import AdminNavigator from './AdminNavigator';

// Single app, three roles (customer / rider / admin) as agreed for this project.
// Once signed in, the user's role decides which navigator is shown.
export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {!user ? (
        <RoleSelectScreen />
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
