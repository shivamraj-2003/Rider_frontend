import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../theme';

// 01 · Splash. Purely presentational — RootNavigator keeps it mounted for a
// minimum 1200ms while session restore + font loading finish, then swaps to
// the first real screen. The lockup (shield + "TOP RIDER" + tagline) is the
// artwork itself, so no separate text is drawn here.
export default function SplashScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.glow} />

      <View style={styles.markTile}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.mark}
          resizeMode="contain"
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <View style={styles.fill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(232,121,43,0.10)',
  },
  markTile: {
    width: 200,
    height: 200,
    borderRadius: 36,
    backgroundColor: colors.white,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: '100%', height: '100%' },
  footer: { position: 'absolute', bottom: 46, alignItems: 'center' },
  track: {
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  fill: { width: 64, height: 3, backgroundColor: colors.accent },
});
