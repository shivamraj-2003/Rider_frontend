import React from 'react';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import { useAuth } from '../../context/AuthContext';

export default function AccountScreen() {
  const { user } = useAuth();

  return (
    <ScreenScaffold title="Account">
      <InfoCard label="Name" value={user?.name ?? '—'} />
      <InfoCard label="Phone" value={user?.phone ?? '—'} />
      <InfoCard label="Verified" value={user?.isVerified ? 'Yes' : 'No'} />
    </ScreenScaffold>
  );
}
