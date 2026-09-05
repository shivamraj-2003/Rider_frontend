import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';
import type { AppConfig, RouteGeometry } from '../types';

// -----------------------------------------------------------------------------
// PLACEHOLDER MAP. Option A(ii) from the Phase 2 plan: no @rnmapbox/maps yet, so
// the booking flow keeps working in Expo Go. The prop surface matches the real
// MapCanvas 1:1 — when the native SDK lands, replace the body of this file with
// a Mapbox.MapView and nothing in the screens changes.
//
// Real map TODO(phase-2):
//   - npx expo install @rnmapbox/maps  (needs a dev client, not Expo Go)
//   - Mapbox.setAccessToken(config.mapbox_public_token) in configureMapbox()
//   - GeoJSON is [lng, lat]; draw route / pickup / drop / rider markers
// -----------------------------------------------------------------------------

type LatLng = { lat: number; lng: number };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function configureMapbox(_config: AppConfig): void {
  // no-op until the native SDK is wired
}

interface MapCanvasProps {
  styleUrl?: string;
  center?: LatLng | null;
  pickup?: LatLng | null;
  drop?: LatLng | null;
  route?: RouteGeometry | null;
  riderLocation?: LatLng | null;
  nearby?: LatLng[];
  dim?: boolean;
}

export default function MapCanvas({ pickup, drop, riderLocation, dim }: MapCanvasProps) {
  return (
    <View style={styles.fill} pointerEvents="none">
      <View style={styles.base} />
      {/* Faint grid so it reads as a map surface, not a blank panel. */}
      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, styles.gridH, { top: `${(i + 1) * 14}%` }]} />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLine, styles.gridV, { left: `${(i + 1) * 20}%` }]} />
        ))}
      </View>

      {/* Indicative markers near the centre — not geographically projected. */}
      <View style={styles.markers}>
        {pickup ? <View style={[styles.pin, styles.pickupPin]} /> : null}
        {riderLocation ? <View style={[styles.pin, styles.riderPin]} /> : null}
        {drop ? <View style={[styles.pin, styles.dropPin]} /> : null}
      </View>

      {dim ? <View style={styles.dim} /> : null}
    </View>
  );
}

const fillObject = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  fill: { ...fillObject },
  base: { ...fillObject, backgroundColor: colors.mapBase },
  grid: { ...fillObject },
  gridLine: { position: 'absolute', backgroundColor: colors.mapGrid },
  gridH: { left: 0, right: 0, height: 1 },
  gridV: { top: 0, bottom: 0, width: 1 },
  markers: {
    ...fillObject,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 18,
  },
  pin: { borderWidth: 3, borderColor: colors.white },
  pickupPin: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent },
  dropPin: { width: 16, height: 16, borderRadius: 3, backgroundColor: colors.navy800 },
  riderPin: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navy800 },
  dim: { ...fillObject, backgroundColor: 'rgba(15,42,71,0.5)' },
});
