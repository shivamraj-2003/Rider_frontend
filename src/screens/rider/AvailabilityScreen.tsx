import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';

// Maps to Agreement sections 3 & 4: nearest-rider assignment/notification,
// live trip/location tracking, ride completion/cancellation.
export default function AvailabilityScreen() {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <ScreenScaffold title="Rider Home" subtitle="Go online to receive ride requests">
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
        <Switch value={isOnline} onValueChange={setIsOnline} />
      </View>
      <InfoCard label="Active Trip" value="None" />
      <InfoCard label="Today's Earnings" value="₹0" />
      <Text style={styles.note}>
        TODO: integrate expo-location for live tracking + backend socket for ride requests.
      </Text>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 10,
  },
  toggleLabel: { fontSize: 16, fontWeight: '600' },
  note: { fontSize: 12, color: '#999', marginTop: 12 },
});
