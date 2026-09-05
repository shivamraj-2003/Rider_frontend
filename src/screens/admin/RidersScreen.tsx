import React from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import ScreenScaffold from '../../components/ScreenScaffold';
import InfoCard from '../../components/InfoCard';

// Maps to Agreement section 5: rider availability, rider performance/booking statistics.
export default function RidersScreen() {
  const riders: { id: string; label: string }[] = [];

  return (
    <ScreenScaffold title="Riders">
      <FlatList
        data={riders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InfoCard label="Rider" value={item.label} />}
        ListEmptyComponent={<Text style={styles.empty}>No riders yet.</Text>}
        scrollEnabled={false}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 13, color: '#999' },
});
