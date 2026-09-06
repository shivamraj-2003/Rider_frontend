import React, { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react-native';
import { useAuth } from '../../../context/AuthContext';
import RiderStatusScreen from './RiderStatusScreen';

const POLL_MS = 8000;
const JUST_CHECKED_MS = 4000;

// Shown while RiderProfile.status === 'pending_verification'. Polls quietly
// so the rider is moved on to the dashboard the moment an admin approves
// them, without needing to reopen the app (§ Become a Rider flow).
export default function VerificationPendingScreen({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
}) {
  const { signOut } = useAuth();
  // Tapping "Check status now" and staying on this exact screen (nothing
  // changed) used to look like the tap did nothing — swap the message
  // briefly so the rider knows the check actually happened.
  const [justChecked, setJustChecked] = useState(false);

  useEffect(() => {
    const t = setInterval(onRefresh, POLL_MS);
    return () => clearInterval(t);
  }, [onRefresh]);

  useEffect(() => {
    if (!justChecked) return;
    const t = setTimeout(() => setJustChecked(false), JUST_CHECKED_MS);
    return () => clearTimeout(t);
  }, [justChecked]);

  const handleCheck = async () => {
    setJustChecked(false);
    await onRefresh();
    setJustChecked(true);
  };

  return (
    <RiderStatusScreen
      icon={IconClock}
      tint="accent"
      title="Verification in progress"
      message={
        justChecked
          ? "Still under review — no update yet. We'll move you to your dashboard automatically the moment you're approved."
          : "We're reviewing your documents and vehicle details. This usually takes a little while — you'll be moved to your dashboard automatically once you're approved."
      }
      primaryLabel="Check status now"
      onPrimary={handleCheck}
      primaryLoading={refreshing}
      secondaryLabel="Log out"
      onSecondary={() => signOut()}
    />
  );
}
