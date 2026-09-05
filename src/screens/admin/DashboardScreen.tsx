import React from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';

// Maps to Agreement section 5: Admin Dashboard.
export default function DashboardScreen() {
  return (
    <ScreenScaffold title="Admin Dashboard" subtitle="Business overview">
      <View style={styles.grid}>
        <InfoCard label="Active Bookings" value="0" />
        <InfoCard label="Completed Rides" value="0" />
        <InfoCard label="Cancelled Rides" value="0" />
        <InfoCard label="Active Trips" value="0" />
        <InfoCard label="Riders Online" value="0" />
        <InfoCard label="Revenue (Today)" value="₹0" />
        <InfoCard label="Commission (Today)" value="₹0" />
        <InfoCard label="Safety Alerts" value="0" />
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
});
