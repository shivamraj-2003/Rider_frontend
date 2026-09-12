// Core domain types shared across the app.
// Enums and shapes mirror Rider_backend's FRONTEND_INTEGRATION.md verbatim —
// keep this file in sync with that guide, not the other way around.

import { IconCar, IconMotorbike, IconScooter, IconTruck } from '@tabler/icons-react-native';
import type { TablerIcon as Icon } from './icon';

// GET /bookings and other paginated list endpoints — mirrors app/schemas/common.py Page.
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

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
export type VehicleType = 'bike' | 'auto' | 'tempo' | 'car';
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
  // True only once Razorpay AND a RazorpayX settlement account are both
  // configured - admin can pay riders directly, not just record a payout.
  payouts_enabled: boolean;
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
// Mirrors BookingOut exactly (Rider_backend app/schemas/booking.py) — there is
// no `fare` field on the wire, only `quoted_fare`/`final_fare`.
export interface BookingOut {
  id: string;
  reference: string;
  status: BookingStatus;
  customer_id: string;
  rider_id: string | null;
  vehicle_type: VehicleType;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string | null;
  drop_lat: number;
  drop_lng: number;
  drop_address: string | null;
  quoted_fare: number | null;
  final_fare: number | null;
  route_geometry: RouteGeometry | null;
  route_source: string | null;
  payment_method: PaymentMethod;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  rider?: AssignedRider | null;
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

// GET /riders/nearby — dots on the customer's pre-booking map.
export interface NearbyRider {
  rider_id: string;
  lat: number;
  lng: number;
  heading: number | null;
  distance_km: number;
  vehicle_type: VehicleType;
}

// GET /places/popular — real most-booked drop points near a location,
// grouped from completed bookings across all customers.
export interface PopularPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  trip_count: number;
  distance_km: number;
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
export const VEHICLE_META: Record<VehicleType, { label: string; icon: Icon; seats: string }> = {
  bike: { label: 'Bike', icon: IconMotorbike, seats: '1 seat' },
  auto: { label: 'Auto', icon: IconScooter, seats: '3 seats' },
  tempo: { label: 'Tempo', icon: IconTruck, seats: 'Goods · 6 seats' },
  car: { label: 'Car', icon: IconCar, seats: '4 seats · AC' },
};

// ₹ formatter — rounds to whole rupees for display.
export const rupees = (n: number): string => `₹${Math.round(n)}`;

// Nested on BookingOut/BookingLive once a rider is assigned — the "who's
// picking me up" card: name, photo, rating, plate, phone (for Call).
export interface AssignedRider {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  rating: number | null;
  vehicle_type: VehicleType;
  vehicle_number: string | null;
}

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
  rider: AssignedRider | null;
}

// GET /riders/me — mirrors RiderOut exactly (Rider_backend app/schemas/rider.py).
export interface RiderMe {
  id: string;
  user_id: string;
  status: RiderStatus;
  availability: RiderAvailability;
  vehicle_type: VehicleType;
  vehicle_number: string | null;
  total_trips: number;
  rating: number | null;
  aadhaar_number: string | null;
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  licence_doc_path: string | null;
  rc_doc_path: string | null;
  aadhaar_doc_path: string | null;
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

// --- Customer daily-commute subscription (Home <-> Office), not a
// company/office plan. Mirrors app/schemas/subscription.py.

export type SubscriptionTripType = 'one_way' | 'round_trip';
export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled';
export const COMMUTE_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type CommuteDay = (typeof COMMUTE_DAYS)[number];

// GET /subscriptions/plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  vehicle_type: VehicleType;
  monthly_price: number;
  included_rides: number;
  working_days: number;
  trip_type: SubscriptionTripType;
  max_km_per_trip: number;
  extra_km_charge: number;
  extra_ride_charge: number;
  discount_percent: number;
  validity_days: number;
  cancellation_window_hours: number;
  cancel_within_window_deducts_ride: boolean;
  pause_allowed: boolean;
  max_pause_days: number;
  extend_validity_on_pause: boolean;
  is_active: boolean;
}

export interface SubscriptionLocation {
  address: string;
  lat: number;
  lng: number;
}

// POST /subscriptions/preview-route
export interface RoutePreview {
  distance_km: number;
  duration_min: number;
  max_km_per_trip: number;
  within_limit: boolean;
  excess_km: number;
  extra_km_charge_per_trip: number;
}

// GET /subscriptions/me, /subscriptions/history, and the mutation responses
export interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  vehicle_type: VehicleType;
  monthly_price: number;
  trip_type: SubscriptionTripType;
  total_rides: number;
  used_rides: number;
  remaining_rides: number;
  max_km_per_trip: number;
  route_distance_km: number;
  extra_km_charge: number;
  extra_ride_charge: number;
  cancellation_window_hours: number;
  cancel_within_window_deducts_ride: boolean;
  pause_allowed: boolean;
  max_pause_days: number;
  home_address: string;
  home_lat: number;
  home_lng: number;
  office_address: string;
  office_lat: number;
  office_lng: number;
  days: CommuteDay[];
  pickup_time: string; // "HH:MM:SS"
  return_time: string | null;
  status: SubscriptionStatus;
  is_expiring_soon: boolean;
  start_date: string;
  end_date: string;
  paused_until: string | null;
}
