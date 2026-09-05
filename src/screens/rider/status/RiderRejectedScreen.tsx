import React from 'react';
import { IconCircleX } from '@tabler/icons-react-native';
import { useAuth } from '../../../context/AuthContext';
import RiderStatusScreen from './RiderStatusScreen';

// Backend has no rejection-reason field today — keep this generic rather
// than inventing one.
export default function RiderRejectedScreen() {
  const { switchRole } = useAuth();

  return (
    <RiderStatusScreen
      icon={IconCircleX}
      tint="danger"
      title="Application not approved"
      message="Your rider application wasn't approved this time. Contact support if you think this is a mistake."
      secondaryLabel="Switch to User Mode"
      onSecondary={() => switchRole('customer')}
    />
  );
}
