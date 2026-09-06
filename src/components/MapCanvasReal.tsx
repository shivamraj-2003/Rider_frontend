import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Mapbox, { MapView, Camera, MarkerView, ShapeSource, LineLayer } from '@rnmapbox/maps';
import { colors, font, radius, shadow } from '../theme';
import { VEHICLE_META } from '../types';
import RiderVehicleMarker from './RiderVehicleMarker';
import type { AppConfig } from '../types';
import type { LatLng, MapCanvasProps, NearbyRiderMarker } from './mapCanvasTypes';

// -----------------------------------------------------------------------------
// REAL MAP (native @rnmapbox/maps). Only ever loaded via the dynamic require()
// in MapCanvas.tsx, and only outside Expo Go — never import this file
// directly or at the top of another module, or Metro/Expo Go will try to
// initialise the native module and crash. Needs a dev client: run
// `npx expo prebuild` + `npx expo run:android` / `run:ios` (or an EAS
// dev-client build). See app.config.js for the download-token setup that
// build needs.
// -----------------------------------------------------------------------------

// Falls back to Bengaluru (this deployment's launch city, per the app's own
// sample places) only when we truly have no coordinate to centre on yet.
const FALLBACK_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

let tokenSet = false;

// Called once from AppConfigContext after GET /config resolves.
export function configureMapbox(config: AppConfig): void {
  if (tokenSet || !config.mapbox_public_token) return;
  Mapbox.setAccessToken(config.mapbox_public_token);
  Mapbox.setTelemetryEnabled(false);
  tokenSet = true;
}

// Trims a full Mapbox place_name ("MG Road, Bengaluru, Karnataka 560001,
// India") down to the headline a marker label shows.
function shortLabel(label?: string | null): string | null {
  if (!label) return null;
  return label.split(',')[0].trim() || null;
}

function boundsFor(points: LatLng[]): { ne: [number, number]; sw: [number, number] } | null {
  if (points.length < 2) return null;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return { ne: [maxLng, maxLat], sw: [minLng, minLat] };
}

export default function MapCanvasReal({
  styleUrl,
  center,
  pickup,
  pickupLabel,
  drop,
  dropLabel,
  route,
  riderLocation,
  nearby,
  dim,
}: MapCanvasProps) {
  const [selected, setSelected] = useState<NearbyRiderMarker | null>(null);
  const focus = center ?? pickup ?? drop ?? FALLBACK_CENTER;

  const bounds = useMemo(() => {
    const pts: LatLng[] = [];
    if (pickup) pts.push(pickup);
    if (drop) pts.push(drop);
    if (riderLocation) pts.push(riderLocation);
    return boundsFor(pts);
  }, [pickup, drop, riderLocation]);

  const routeFeature = useMemo(
    () => (route ? { type: 'Feature' as const, properties: {}, geometry: route } : null),
    [route]
  );

  return (
    <View style={styles.fill}>
      <MapView
        style={styles.fill}
        styleURL={styleUrl ?? Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        compassEnabled={false}
      >
        {bounds ? (
          <Camera
            bounds={{
              ne: bounds.ne,
              sw: bounds.sw,
              paddingLeft: 60,
              paddingRight: 60,
              paddingTop: 120,
              paddingBottom: 220,
            }}
            animationDuration={450}
          />
        ) : (
          <Camera centerCoordinate={[focus.lng, focus.lat]} zoomLevel={14} animationDuration={450} />
        )}

        {routeFeature ? (
          <ShapeSource id="routeSource" shape={routeFeature}>
            <LineLayer
              id="routeLine"
              style={{ lineColor: colors.accent, lineWidth: 4, lineCap: 'round', lineJoin: 'round' }}
            />
          </ShapeSource>
        ) : null}

        {nearby?.map((rider) => (
          <MarkerView key={rider.id} coordinate={[rider.lng, rider.lat]} anchor={{ x: 0.5, y: 0.5 }}>
            <Pressable
              onPress={() => setSelected((cur) => (cur?.id === rider.id ? null : rider))}
              accessibilityRole="button"
              accessibilityLabel="Nearby rider"
            >
              <RiderVehicleMarker vehicleType={rider.vehicleType ?? 'bike'} heading={rider.heading} />
            </Pressable>
          </MarkerView>
        ))}

        {riderLocation ? (
          <MarkerView coordinate={[riderLocation.lng, riderLocation.lat]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.riderPin} />
          </MarkerView>
        ) : null}

        {pickup ? (
          <MarkerView coordinate={[pickup.lng, pickup.lat]} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerColumn}>
              {shortLabel(pickupLabel) ? (
                <View style={styles.labelPill}>
                  <Text style={styles.labelHeading}>Pickup</Text>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {shortLabel(pickupLabel)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.pin}>
                <View style={styles.pinDot} />
              </View>
            </View>
          </MarkerView>
        ) : null}

        {drop ? (
          <MarkerView coordinate={[drop.lng, drop.lat]} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerColumn}>
              {shortLabel(dropLabel) ? (
                <View style={styles.labelPill}>
                  <Text style={styles.labelHeading}>Drop</Text>
                  <Text style={styles.labelText} numberOfLines={1}>
                    {shortLabel(dropLabel)}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.pin, styles.dropPin]}>
                <View style={[styles.pinDot, styles.dropPinDot]} />
              </View>
            </View>
          </MarkerView>
        ) : null}
      </MapView>

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
  markerColumn: { alignItems: 'center', gap: 6 },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  dropPin: { backgroundColor: colors.navy800, borderRadius: 8 },
  dropPinDot: { borderRadius: 2 },
  riderPin: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.navy800,
    borderWidth: 3,
    borderColor: colors.white,
  },
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
  labelPill: {
    maxWidth: 160,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#0F2A47',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  labelHeading: {
    fontFamily: font.semibold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink400,
  },
  labelText: { fontFamily: font.bold, fontSize: 12.5, color: colors.navy800 },
  dim: { ...fillObject, backgroundColor: 'rgba(15,42,71,0.5)' },
});
