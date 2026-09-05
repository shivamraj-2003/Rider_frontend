import React from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';

// Maps to Agreement section 3: booking and ride history.
export default function RideHistoryScreen() {
  const trips: { id: string; label: string }[] = [];

  return (
    <ScreenScaffold title="Ride History">
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InfoCard label="Trip" value={item.label} />}
        ListEmptyComponent={<Text style={styles.empty}>No rides yet.</Text>}
        scrollEnabled={false}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 13, color: '#999' },
});
