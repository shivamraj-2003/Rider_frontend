// Core domain types shared across the app.
// Enums and shapes mirror Rider_backend's FRONTEND_INTEGRATION.md verbatim —
// keep this file in sync with that guide, not the other way around.

export type UserRole = 'customer' | 'rider' | 'admin';

export type BookingStatus =
  | 'requested'
  | 'assigned'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_rider'
  | 'no_riders_found';

export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
  'completed',
  'cancelled_by_customer',
  'cancelled_by_rider',
  'no_riders_found',
];

export type RiderStatus = 'pending_verification' | 'approved' | 'suspended' | 'rejected';
export type RiderAvailability = 'offline' | 'online' | 'on_trip';
export type VehicleType = 'bike' | 'auto' | 'car';
export type PaymentMethod = 'cash' | 'online' | 'wallet';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';
export type SafetyAlertType = 'sos' | 'prolonged_stop' | 'route_deviation' | 'overspeed';

// POST /auth/verify-otp -> user, and GET /auth/me
export interface UserOut {
  id: string;
  role: UserRole;
  phone: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

// POST /auth/verify-otp and POST /auth/refresh response shape
export interface Session {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  user: UserOut;
  is_new_user: boolean;
  profile_complete: boolean;
}

// GET /config
export interface AppConfig {
  role: UserRole;
  maps_enabled: boolean;
  payments_enabled: boolean;
  mapbox_public_token: string | null;
  mapbox_style_url: string | null;
  vehicle_types: VehicleType[];
  currency: string;
  // Shapes per FRONTEND_INTEGRATION.md §3 — each setting is a small object,
  // not a bare value.
  settings: {
    booking_enabled: { enabled: boolean };
    support_phone: { number: string | null };
    min_app_version: { ios: string; android: string } | null;
  };
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

// GeoJSON LineString as returned by POST /bookings `route_geometry` (§5).
// Coordinates are [lng, lat] pairs — Mapbox order.
export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

// BookingOut — the fields used by the booking/tracking flow.
// `route_geometry` and `reference` are documented on the ride-offer / shared-trip
// payloads (§5, §8); they are treated as optional on this shape since the guide
// does not spell them out on every BookingOut response.
export interface BookingOut {
  id: string;
  status: BookingStatus;
  vehicle_type: VehicleType;
  payment_method: PaymentMethod;
  pickup_address: string;
  drop_address: string;
  fare: number | null;
  created_at: string;
  reference?: string;
  route_geometry?: RouteGeometry | null;
}

// GET /places/search, GET /places/reverse, GET /places/saved
export interface Place {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// GET /places/saved rows carry a label ("Home"/"Work"/custom) on top of Place.
export interface SavedPlace extends Place {
  id: string;
  label: string;
}

// POST /bookings/estimates — one row per vehicle type
export interface FareEstimate {
  vehicle_type: VehicleType;
  fare: number;
  distance_km: number;
  duration_min: number;
  surge_multiplier: number;
}

// POST /bookings/quote — same maths as one estimate row plus a full breakdown (§5).
export interface FareQuote extends FareEstimate {
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  waiting_charge: number;
}

// UI copy for each server vehicle_type. Screens render only the types /config
// returns, so a new server-side type just needs a row added here.
// TODO(phase-2): swap `glyph` text for real vehicle artwork.
export const VEHICLE_META: Record<VehicleType, { label: string; glyph: string; seats: string }> = {
  bike: { label: 'Bike', glyph: 'BIKE', seats: '1 seat' },
  auto: { label: 'Auto', glyph: 'AUTO', seats: '3 seats' },
  car: { label: 'Car', glyph: 'CAR', seats: '4 seats · AC' },
};

// ₹ formatter — rounds to whole rupees for display.
export const rupees = (n: number): string => `₹${Math.round(n)}`;

// GET /bookings/{id}/live
export interface BookingLive {
  booking_id: string;
  status: BookingStatus;
  rider_location: {
    lat: number;
    lng: number;
    speed_kmph: number;
    heading: number;
    recorded_at: string;
  } | null;
  eta_minutes: number | null;
  updated_at: string;
}

// GET /riders/me
export interface RiderMe {
  id: string;
  status: RiderStatus;
  availability: RiderAvailability;
  vehicle_type: VehicleType;
  vehicle_number: string;
  vehicle_model: string;
  licence_number: string;
  rating: number | null;
}

// GET /riders/offers, and the WS `ride_offer` event payload
export interface RideOffer {
  booking_id: string;
  reference: string;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  fare: number;
  distance_to_pickup_km: number;
  expires_in: number;
}

// GET /riders/me/stats
export interface RiderStats {
  trips_today: number;
  earnings_today: number;
  total_trips: number;
  cancelled_trips: number;
  rating: number | null;
  acceptance_rate: number;
}

// GET /earnings/summary
export interface EarningsSummary {
  today: number;
  this_week: number;
  this_month: number;
  lifetime: number;
  pending_settlement: number;
  trips_today: number;
}

// GET /earnings — per-trip ledger row
export interface EarningsEntry {
  booking_id: string;
  gross_fare: number;
  commission: number;
  net_earning: number;
  settlement_status: string;
  created_at: string;
}
