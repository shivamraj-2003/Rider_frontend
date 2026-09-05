import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, font, space } from '../../theme';
import Button from '../../components/Button';
import TextField from '../../components/TextField';
import { submitReview } from '../../services/reviews';
import { ApiError } from '../../services/api';
import type { CustomerStackParamList } from '../../navigation/CustomerNavigator';

type Props = NativeStackScreenProps<CustomerStackParamList, 'RateRide'>;

// Extracted from the old inline block in TrackRideScreen — uses the richer
// POST /reviews/{booking_id} (rating + optional comment) instead of the bare
// POST /bookings/{id}/rate, matching "1-5 star rating, optional review".
export default function RateRideScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rating) {
      setError('Tap a star to rate your trip');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitReview(bookingId, { rating, comment: comment.trim() || undefined });
      navigation.navigate('Tabs');
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof ApiError ? err.message : 'Could not submit your rating.');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>Rate your ride</Text>
        <Text style={styles.subtitle}>How was your trip?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
              <Text style={[styles.star, n <= rating && styles.starFilled]}>★</Text>
            </Pressable>
          ))}
        </View>

        <TextField
          placeholder="Write a review (optional)"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Button title="Submit" onPress={handleSubmit} loading={submitting} disabled={!rating} />
        <Button title="Skip" variant="secondary" onPress={() => navigation.navigate('Tabs')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28 },
  body: { flex: 1, justifyContent: 'center', gap: space.lg },
  title: { fontFamily: font.extrabold, fontSize: 24, letterSpacing: -0.4, color: colors.navy800, textAlign: 'center' },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.ink600, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginVertical: space.md },
  star: { fontSize: 40, color: colors.line300 },
  starFilled: { color: colors.accent },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger, textAlign: 'center' },
  footer: { gap: space.sm, paddingBottom: space.lg },
});
