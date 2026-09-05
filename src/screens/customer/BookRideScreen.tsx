import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';

// Maps to Agreement section 3: booking system, nearest-rider assignment, pricing.
export default function BookRideScreen() {
  return (
    <ScreenScaffold title="Book a Ride" subtitle="Where are you headed?">
      <View style={styles.grid}>
        <InfoCard label="Pickup" value="Set current location" />
        <InfoCard label="Destination" value="Choose destination" />
        <InfoCard label="Estimated Fare" value="—" />
      </View>
      <Text style={styles.note}>
        TODO: integrate maps (react-native-maps) + geocoding + backend booking API.
      </Text>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  note: { fontSize: 12, color: '#999', marginTop: 12 },
});
