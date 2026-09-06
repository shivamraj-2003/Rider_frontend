import type { RouteGeometry, VehicleType } from '../types';

// Shared prop surface for MapCanvasReal and MapCanvasPlaceholder — kept in
// its own file (no component code) so MapCanvas.tsx's dispatcher can import
// the type without ever importing MapCanvasReal's module body (which pulls
// in the native @rnmapbox/maps package).
export type LatLng = { lat: number; lng: number };

// A nearby-rider dot on the pre-booking map (GET /riders/nearby) — enough to
// draw an animated, heading-aware marker and show a distance card on tap.
export interface NearbyRiderMarker extends LatLng {
  id: string;
  heading?: number | null;
  distanceKm?: number;
  vehicleType?: VehicleType;
}

export interface MapCanvasProps {
  styleUrl?: string;
  center?: LatLng | null;
  pickup?: LatLng | null;
  pickupLabel?: string | null;
  drop?: LatLng | null;
  dropLabel?: string | null;
  route?: RouteGeometry | null;
  riderLocation?: LatLng | null;
  nearby?: NearbyRiderMarker[];
  dim?: boolean;
}
