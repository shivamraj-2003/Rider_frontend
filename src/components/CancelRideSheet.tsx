import React, { useState } from 'react';
import { Modal, View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { IconX } from '@tabler/icons-react-native';
import Button from './Button';
import TextField from './TextField';
import { colors, font, radius, shadow, space } from '../theme';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';

// Shared cancel-ride sheet — reused by TrackRideScreen (a rider is already
// assigned, a fee may apply) and SearchingRiderScreen (still just searching).
// Quick reason chips beat a bare text field: faster to tap, and the reason
// text the backend stores is more useful for the ops side than free text
// most people would leave blank anyway.
const REASONS = [
  'Changed my mind',
  'Booked by mistake',
  'Rider is taking too long',
  'Found another ride',
  'Price is too high',
];

interface Props {
  visible: boolean;
  busy?: boolean;
  warning?: string;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function CancelRideSheet({ visible, busy, warning, error, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [custom, setCustom] = useState('');

  const isOther = reason === 'Other';
  const canConfirm = !!reason && (!isOther || custom.trim().length > 0);

  const handleClose = () => {
    setReason(null);
    setCustom('');
    onClose();
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(isOther ? custom.trim() : (reason as string));
  };

  const { panHandlers, style: dragStyle } = useSwipeDismiss(handleClose);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close" />
        <Animated.View style={[styles.sheet, dragStyle]}>
          <View style={styles.grabZone} {...panHandlers}>
            <View style={styles.grab} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Cancel this ride?</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <IconX size={18} color={colors.ink600} strokeWidth={2} />
            </Pressable>
          </View>

          {warning ? <Text style={styles.warning}>{warning}</Text> : null}

          <Text style={styles.prompt}>Tell us why (helps us improve)</Text>
          <View style={styles.chipWrap}>
            {[...REASONS, 'Other'].map((r) => {
              const selected = reason === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  style={[styles.chip, selected && styles.chipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          {isOther ? (
            <TextField placeholder="What happened?" value={custom} onChangeText={setCustom} autoFocus />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title="Keep ride" variant="navy" onPress={handleClose} style={styles.actionBtn} />
            <Button
              title={busy ? 'Cancelling…' : 'Cancel ride'}
              variant="secondary"
              onPress={handleConfirm}
              loading={busy}
              disabled={!canConfirm}
              style={styles.actionBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,42,71,0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 34,
    gap: space.md,
    ...shadow.sheet,
  },
  grabZone: { alignItems: 'center', paddingBottom: 4 },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line300 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font.extrabold, fontSize: 19, letterSpacing: -0.3, color: colors.navy800 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warning: {
    fontFamily: font.medium,
    fontSize: 13,
    color: colors.accentDark,
    backgroundColor: colors.accentTint,
    borderRadius: radius.control,
    padding: 12,
  },
  prompt: { fontFamily: font.semibold, fontSize: 13, color: colors.ink600 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.line200,
    backgroundColor: colors.white,
  },
  chipSelected: { borderColor: colors.accent, backgroundColor: colors.accentFaint },
  chipLabel: { fontFamily: font.semibold, fontSize: 13, color: colors.ink600 },
  chipLabelSelected: { color: colors.accentDark },
  error: { fontFamily: font.medium, fontSize: 13, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1 },
});
