import React from 'react';
import { IconBan } from '@tabler/icons-react-native';
import { useAuth } from '../../../context/AuthContext';
import RiderStatusScreen from './RiderStatusScreen';

export default function RiderSuspendedScreen() {
  const { switchRole } = useAuth();

  return (
    <RiderStatusScreen
      icon={IconBan}
      tint="danger"
      title="Account suspended"
      message="Your rider account has been suspended. Contact support for help getting back online."
      secondaryLabel="Switch to User Mode"
      onSecondary={() => switchRole('customer')}
    />
  );
}
