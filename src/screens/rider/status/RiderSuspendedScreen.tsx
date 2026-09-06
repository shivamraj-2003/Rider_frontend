import React from 'react';
import { IconBan } from '@tabler/icons-react-native';
import { useAuth } from '../../../context/AuthContext';
import RiderStatusScreen from './RiderStatusScreen';

// No in-session mode switch any more (User/Rider are separate flows, chosen
// at login) — "Log out" is the only way out of a terminal rider status.
export default function RiderSuspendedScreen() {
  const { signOut } = useAuth();

  return (
    <RiderStatusScreen
      icon={IconBan}
      tint="danger"
      title="Account suspended"
      message="Your rider account has been suspended. Contact support for help getting back online."
      secondaryLabel="Log out"
      onSecondary={() => signOut()}
    />
  );
}
