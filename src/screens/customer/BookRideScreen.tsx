import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenScaffold from '../../components/ScreenScaffold';
import PlacePicker from '../../components/PlacePicker';
import Button from '../../components/Button';
import { useAppConfig } from '../../context/AppConfigContext';
import { getSavedPlaces } from '../../services/customer';
import { colors, radius, spacing, typography } from '../../theme';
import type { Place, SavedPlace } from '../../types';
import type { CustomerStackParamList, CustomerTabParamList } from '../../navigation/CustomerNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'Book'>,
  NativeStackScreenProps<CustomerStackParamList>
>;

// Maps to Agreement section 3: booking system, nearest-rider assignment, pricing.
export default function BookRideScreen({ navigation }: Props) {
  const { activeBooking } = useAppConfig();
  const [pickup, setPickup] = useState<Place | null>(null);
  const [drop, setDrop] = useState<Place | null>(null);
  const [saved, setSaved] = useState<SavedPlace[]>([]);

  useEffect(() => {
    getSavedPlaces()
      .then(setSaved)
      .catch(() => setSaved([]));
  }, []);

  const canContinue = !!pickup && !!drop;

  return (
    <ScreenScaffold title="Book a Ride" subtitle="Where are you headed?">
      {activeBooking ? (
        <Pressable
          style={styles.resumeBanner}
          onPress={() => navigation.navigate('TrackRide', { bookingId: activeBooking.id })}
        >
          <Text style={styles.resumeTitle}>You have a ride in progress</Text>
          <Text style={styles.resumeDetail}>
            {activeBooking.pickup_address} → {activeBooking.drop_address}
          </Text>
          <Text style={styles.resumeStatus}>Status: {activeBooking.status} · Tap to track</Text>
        </Pressable>
      ) : null}

      <PlacePicker label="Pickup" placeholder="Search pickup location" value={pickup} onSelect={setPickup} />
      <PlacePicker label="Destination" placeholder="Search destination" value={drop} onSelect={setDrop} />

      {saved.length > 0 ? (
        <View style={styles.savedRow}>
          {saved.map((place) => (
            <Pressable key={place.id} style={styles.savedChip} onPress={() => setDrop(place)}>
              <Text style={styles.savedChipLabel}>{place.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Button
        title="See fares"
        disabled={!canContinue}
        onPress={() => {
          if (pickup && drop) navigation.navigate('FareSelect', { pickup, drop });
        }}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  resumeBanner: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 4,
  },
  resumeTitle: { ...typography.bodyStrong, color: colors.textInverse },
  resumeDetail: { ...typography.caption, color: colors.textInverse },
  resumeStatus: { ...typography.caption, color: colors.accent },
  savedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  savedChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  savedChipLabel: { ...typography.caption, color: colors.primary },
});
