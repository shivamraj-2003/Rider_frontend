import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Mapbox, { MapView, Camera, MarkerView, ShapeSource, LineLayer } from '@rnmapbox/maps';
import { colors, font } from '../theme';
import type { AppConfig, RouteGeometry } from '../types';

// -----------------------------------------------------------------------------
// REAL MAP (native @rnmapbox/maps). Requires a dev client — this component
// (and therefore the whole app, since it's imported eagerly) no longer runs
// in Expo Go. Run `npx expo prebuild` + `npx expo run:android` / `run:ios`
// (or an EAS dev-client build) after installing this. See app.config.js for
// the download-token setup this needs at build time.
// -----------------------------------------------------------------------------

type LatLng = { lat: number; lng: number };

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

interface MapCanvasProps {
  styleUrl?: string;
  center?: LatLng | null;
  pickup?: LatLng | null;
  pickupLabel?: string | null;
  drop?: LatLng | null;
  dropLabel?: string | null;
  route?: RouteGeometry | null;
  riderLocation?: LatLng | null;
  nearby?: LatLng[];
  dim?: boolean;
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

export default function MapCanvas({
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

        {nearby?.map((p, i) => (
          <MarkerView key={`nearby-${i}`} coordinate={[p.lng, p.lat]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.nearbyDot} />
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
  nearbyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink400,
    borderWidth: 2,
    borderColor: colors.white,
  },
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
