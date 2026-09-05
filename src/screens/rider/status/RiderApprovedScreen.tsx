import React from 'react';
import { IconCircleCheck } from '@tabler/icons-react-native';
import RiderStatusScreen from './RiderStatusScreen';

// One-time celebration, shown only for the mount where status flips from
// pending → approved (RiderNavigator tracks that transition), never on every
// later switch into Rider Mode.
export default function RiderApprovedScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <RiderStatusScreen
      icon={IconCircleCheck}
      tint="success"
      title="You're approved!"
      message="Your rider application has been approved. You're ready to go online and start accepting rides."
      primaryLabel="Go to Rider Dashboard"
      onPrimary={onContinue}
    />
  );
}
