import React from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';

// Maps to Agreement section 5: trip history, relevant live trip locations.
export default function TripsScreen() {
  const trips: { id: string; label: string }[] = [];

  return (
    <ScreenScaffold title="All Trips">
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InfoCard label="Trip" value={item.label} />}
        ListEmptyComponent={<Text style={styles.empty}>No trips yet.</Text>}
        scrollEnabled={false}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 13, color: '#999' },
});
