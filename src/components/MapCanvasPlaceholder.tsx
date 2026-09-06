import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme';
import type { MapCanvasProps } from './mapCanvasTypes';

// -----------------------------------------------------------------------------
// PLACEHOLDER MAP — the only one Expo Go can run (no native module). MapCanvas.tsx
// picks this automatically in Expo Go and falls back to it if the real map's
// native module isn't linked yet (e.g. before your first dev-client build).
// Real street tiles/MG-Road-and-all only render from MapCanvasReal.tsx, which
// needs a dev client — see that file's header comment.
// -----------------------------------------------------------------------------

// Trims a full Mapbox place_name ("MG Road, Bengaluru, Karnataka 560001,
// India") down to the headline this schematic view shows next to a pin.
function shortLabel(label?: string | null): string | null {
  if (!label) return null;
  return label.split(',')[0].trim() || null;
}

export default function MapCanvasPlaceholder({ pickup, pickupLabel, drop, dropLabel, riderLocation, dim }: MapCanvasProps) {
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

      {/* Indicative markers near the centre — not geographically projected,
          but labelled with the real place name so it's not just coloured dots. */}
      <View style={styles.markers}>
        {pickup ? (
          <View style={styles.markerGroup}>
            <View style={[styles.pin, styles.pickupPin]} />
            {shortLabel(pickupLabel) ? (
              <View style={styles.labelPill}>
                <Text style={styles.labelText} numberOfLines={1}>{shortLabel(pickupLabel)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {riderLocation ? <View style={[styles.pin, styles.riderPin]} /> : null}
        {drop ? (
          <View style={styles.markerGroup}>
            <View style={[styles.pin, styles.dropPin]} />
            {shortLabel(dropLabel) ? (
              <View style={styles.labelPill}>
                <Text style={styles.labelText} numberOfLines={1}>{shortLabel(dropLabel)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
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
  markerGroup: { alignItems: 'center', gap: 6 },
  pin: { borderWidth: 3, borderColor: colors.white },
  pickupPin: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent },
  dropPin: { width: 16, height: 16, borderRadius: 3, backgroundColor: colors.navy800 },
  riderPin: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.navy800 },
  labelPill: {
    maxWidth: 110,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  labelText: { fontFamily: font.semibold, fontSize: 10.5, color: colors.navy800 },
  dim: { ...fillObject, backgroundColor: 'rgba(15,42,71,0.5)' },
});
