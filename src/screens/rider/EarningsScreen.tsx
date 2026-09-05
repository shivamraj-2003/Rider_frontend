import React from 'react';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';

// Maps to Agreement section 3: rider earnings calculation, company commission calculation.
export default function EarningsScreen() {
  return (
    <ScreenScaffold title="Earnings">
      <InfoCard label="Total Trips" value="0" />
      <InfoCard label="Total Earnings" value="₹0" />
      <InfoCard label="Commission Paid" value="₹0" />
    </ScreenScaffold>
  );
}
