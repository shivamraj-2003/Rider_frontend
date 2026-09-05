import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { colors, type, radius, shadow, space } from '../../theme';
import Button from '../../components/Button';

interface Props {
  // Called once the user has either responded to the OS dialog or chosen to
  // enter their address by hand. `manual` is true for the fallback path.
  onDone: (opts: { manual: boolean }) => void;
}

// 06 · Location permission — the explainer shown BEFORE the OS dialog.
export default function LocationPermissionScreen({ onDone }: Props) {
  const [busy, setBusy] = useState(false);

  const allow = async () => {
    setBusy(true);
    try {
      // Whether they grant or deny, we move on — the app still works with a
      // typed pickup address, and rider-side flows re-request when needed.
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // ignore — treated the same as a denial
    } finally {
      setBusy(false);
      onDone({ manual: false });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.mapStub}>
        <View style={styles.pin} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.icon}>
          <View style={styles.dot} />
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>Allow location while you ride</Text>
          <Text style={type.body}>
            We use your location to match the nearest rider, show live tracking and confirm your
            drop-off.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={busy ? 'Please wait…' : 'Allow while using app'}
            onPress={allow}
            loading={busy}
          />
          <Button
            title="Enter address manually"
            variant="secondary"
            onPress={() => onDone({ manual: true })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mapBase, justifyContent: 'flex-end' },
  mapStub: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.mapBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    borderWidth: 4,
    borderColor: colors.white,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 32,
    gap: space.lg,
    ...shadow.sheet,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent },
  heading: { gap: space.sm },
  title: { ...type.sheetTitle, fontSize: 24 },
  actions: { gap: space.sm },
});
