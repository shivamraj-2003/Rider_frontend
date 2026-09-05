import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { colors, radius, spacing, typography } from '../theme';
import type { RideOffer } from '../types';

interface Props {
  offer: RideOffer | null;
  accepting: boolean;
  onAccept: () => void;
  onReject: () => void;
  onExpire: () => void;
}

// Offer modal with a countdown from `expires_in` — the offer is only valid
// for 20s server-side (FRONTEND_INTEGRATION.md §6), so auto-dismiss locally
// when the clock runs out rather than waiting for a failed accept.
export default function RideOfferModal({ offer, accepting, onAccept, onReject, onExpire }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(offer?.expires_in ?? 0);

  useEffect(() => {
    if (!offer) return;
    setSecondsLeft(offer.expires_in);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer?.booking_id]);

  if (!offer) return null;

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.countdown}>{secondsLeft}s</Text>
          <Text style={styles.fare}>₹{offer.fare.toFixed(0)}</Text>
          <Text style={styles.meta}>{offer.distance_to_pickup_km.toFixed(1)} km to pickup</Text>

          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Pickup</Text>
            <Text style={styles.address}>{offer.pickup.address}</Text>
            <Text style={styles.addressLabel}>Drop</Text>
            <Text style={styles.address}>{offer.drop.address}</Text>
          </View>

          <View style={styles.actions}>
            <View style={styles.actionSlot}>
              <Button title="Reject" variant="secondary" onPress={onReject} disabled={accepting} />
            </View>
            <View style={styles.actionSlot}>
              <Button title="Accept" onPress={onAccept} loading={accepting} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,31,58,0.6)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  countdown: { ...typography.label, color: colors.danger, textAlign: 'center' },
  fare: { ...typography.h1, color: colors.primary, textAlign: 'center' },
  meta: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
  addressBlock: { gap: 2, marginBottom: spacing.lg },
  addressLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm },
  address: { ...typography.bodyStrong, color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionSlot: { flex: 1 },
});
