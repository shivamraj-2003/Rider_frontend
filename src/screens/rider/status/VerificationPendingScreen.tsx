import React, { useEffect } from 'react';
import { IconClock } from '@tabler/icons-react-native';
import { useAuth } from '../../../context/AuthContext';
import RiderStatusScreen from './RiderStatusScreen';

const POLL_MS = 8000;

// Shown while RiderProfile.status === 'pending_verification'. Polls quietly
// so the rider is moved on to the dashboard the moment an admin approves
// them, without needing to reopen the app (§ Become a Rider flow).
export default function VerificationPendingScreen({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  const { switchRole } = useAuth();

  useEffect(() => {
    const t = setInterval(onRefresh, POLL_MS);
    return () => clearInterval(t);
  }, [onRefresh]);

  return (
    <RiderStatusScreen
      icon={IconClock}
      tint="accent"
      title="Verification in progress"
      message="We're reviewing your documents and vehicle details. This usually takes a little while — you'll be moved to your dashboard automatically once you're approved."
      primaryLabel="Check status now"
      onPrimary={onRefresh}
      primaryLoading={refreshing}
      secondaryLabel="Switch to User Mode"
      onSecondary={() => switchRole('customer')}
    />
  );
}
