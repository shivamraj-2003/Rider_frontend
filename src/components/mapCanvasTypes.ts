import type { RouteGeometry } from '../types';

// Shared prop surface for MapCanvasReal and MapCanvasPlaceholder — kept in
// its own file (no component code) so MapCanvas.tsx's dispatcher can import
// the type without ever importing MapCanvasReal's module body (which pulls
// in the native @rnmapbox/maps package).
export type LatLng = { lat: number; lng: number };

export interface MapCanvasProps {
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
