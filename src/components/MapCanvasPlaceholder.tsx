import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, font, radius, shadow } from '../theme';
import { VEHICLE_META } from '../types';
import RiderVehicleMarker from './RiderVehicleMarker';
import { useSmoothLatLng } from '../hooks/useSmoothLatLng';
import type { MapCanvasProps, NearbyRiderMarker } from './mapCanvasTypes';

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

// This view has no real map projection - nearby riders are scattered around
// the centre by their actual lat/lng delta (scaled up arbitrarily, since
// there's no true ground distance to map to pixels here), so several riders
// don't all pile on the same spot and their rough relative position/spread
// still means something.
function offsetFor(point: { lat: number; lng: number }, anchor: { lat: number; lng: number }) {
  const dx = (point.lng - anchor.lng) * 4000;
  const dy = (anchor.lat - point.lat) * 4000;
  const clamp = (n: number) => Math.max(-130, Math.min(130, n));
  return { x: clamp(dx), y: clamp(dy) };
}

// Smooths the rider's own lat/lng before turning it into a pixel offset, so
// even this schematic view glides between GPS fixes instead of jumping.
function SmoothNearbyDot({
  rider,
  anchor,
  onPress,
}: {
  rider: NearbyRiderMarker;
  anchor: { lat: number; lng: number };
  onPress: () => void;
}) {
  const pos = useSmoothLatLng(rider);
  if (!pos) return null;
  const { x, y } = offsetFor(pos, anchor);
  return (
    <Pressable
      style={[styles.nearbyWrap, { left: '50%', top: '50%', marginLeft: x - 14, marginTop: y - 14 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Nearby rider"
    >
      <RiderVehicleMarker vehicleType={rider.vehicleType ?? 'bike'} heading={rider.heading} />
    </Pressable>
  );
}

export default function MapCanvasPlaceholder({
  pickup,
  pickupLabel,
  drop,
  dropLabel,
  riderLocation,
  nearby,
  dim,
}: MapCanvasProps) {
  const [selected, setSelected] = useState<NearbyRiderMarker | null>(null);
  const anchor = pickup ?? riderLocation ?? nearby?.[0] ?? null;

  return (
    <View style={styles.fill} pointerEvents="box-none">
      <View style={styles.base} pointerEvents="none" />
      {/* Faint grid so it reads as a map surface, not a blank panel. */}
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, styles.gridH, { top: `${(i + 1) * 14}%` }]} />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLine, styles.gridV, { left: `${(i + 1) * 20}%` }]} />
        ))}
      </View>

      {/* Indicative markers near the centre — not geographically projected,
          but labelled with the real place name so it's not just coloured dots. */}
      <View style={styles.markers} pointerEvents="none">
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

      {/* Nearby available riders — tap one for its distance/vehicle card. */}
      {anchor && nearby
        ? nearby.map((rider) => (
            <SmoothNearbyDot
              key={rider.id}
              rider={rider}
              anchor={anchor}
              onPress={() => setSelected((cur) => (cur?.id === rider.id ? null : rider))}
            />
          ))
        : null}

      {selected ? (
        <View style={styles.infoCard} pointerEvents="box-none">
          <Text style={styles.infoTitle}>Rider available</Text>
          <Text style={styles.infoBody}>
            {VEHICLE_META[selected.vehicleType ?? 'bike'].label}
            {selected.distanceKm != null ? ` · ${selected.distanceKm.toFixed(1)} km from pickup` : ''}
          </Text>
        </View>
      ) : null}

      {dim ? <View style={styles.dim} pointerEvents="none" /> : null}
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
  nearbyWrap: { position: 'absolute' },
  infoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 12,
    gap: 2,
    ...shadow.card,
  },
  infoTitle: { fontFamily: font.bold, fontSize: 13, color: colors.navy800 },
  infoBody: { fontFamily: font.regular, fontSize: 12, color: colors.ink600 },
  dim: { ...fillObject, backgroundColor: 'rgba(15,42,71,0.5)' },
});
