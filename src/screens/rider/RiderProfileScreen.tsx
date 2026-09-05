import React from 'react';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';
import { useAuth } from '../../context/AuthContext';

export default function RiderProfileScreen() {
  const { user } = useAuth();

  return (
    <ScreenScaffold title="Rider Profile">
      <InfoCard label="Name" value={user?.name ?? '—'} />
      <InfoCard label="Phone" value={user?.phone ?? '—'} />
      <InfoCard label="Vehicle" value="—" />
      <InfoCard label="Rating" value="—" />
    </ScreenScaffold>
  );
}
