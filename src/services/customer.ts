// Typed wrappers around the customer-facing booking endpoints
// (FRONTEND_INTEGRATION.md §5). Kept thin — screens call these directly.
import { api } from './api';
import type {
  BookingLive,
  BookingOut,
  BookingStatus,
  FareEstimate,
  FareQuote,
  Page,
  PaymentMethod,
  Place,
  PopularPlace,
  SavedPlace,
  VehicleType,
} from '../types';

export function searchPlaces(query: string, near?: { lat: number; lng: number }, limit = 6) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (near) {
    params.set('lat', String(near.lat));
    params.set('lng', String(near.lng));
  }
  return api.get<Place[]>(`/places/search?${params.toString()}`);
}

export function getSavedPlaces() {
  return api.get<SavedPlace[]>('/places/saved');
}

// GET /places/popular — real most-booked drop points near a location.
export function getPopularPlaces(lat: number, lng: number, limit = 3) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), limit: String(limit) });
  return api.get<PopularPlace[]>(`/places/popular?${params.toString()}`);
}

// GET /places/reverse — map pin / current position → a Place (or null).
export function reverseGeocode(lat: number, lng: number) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return api.get<Place | null>(`/places/reverse?${params.toString()}`);
}

// POST /places/saved — re-posting a label moves it.
export function savePlace(payload: { label: string; address: string; lat: number; lng: number }) {
  return api.post<SavedPlace>('/places/saved', payload);
}

export interface EstimatesRequest {
  pickup_lat: number;
  pickup_lng: number;
  drop_lat: number;
  drop_lng: number;
  vehicle_type: VehicleType;
}

export function getFareEstimates(payload: EstimatesRequest) {
  return api.post<FareEstimate[]>('/bookings/estimates', payload);
}

// POST /bookings/quote — full breakdown for a single vehicle type (§5).
export function getFareQuote(payload: EstimatesRequest) {
  return api.post<FareQuote>('/bookings/quote', payload);
}

export interface CreateBookingRequest {
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  drop_lat: number;
  drop_lng: number;
  drop_address: string;
  vehicle_type: VehicleType;
  payment_method: PaymentMethod;
}

export function createBooking(payload: CreateBookingRequest) {
  return api.post<BookingOut>('/bookings', payload);
}

export function getLiveBooking(bookingId: string) {
  return api.get<BookingLive>(`/bookings/${bookingId}/live`);
}

// Full booking record — used to resync state (§8) and by the rider trip
// screen, which needs addresses/fare that /live doesn't carry.
export function getBooking(bookingId: string) {
  return api.get<BookingOut>(`/bookings/${bookingId}`);
}

export function cancelBooking(bookingId: string, reason: string) {
  return api.post<BookingOut>(`/bookings/${bookingId}/cancel`, { reason });
}

export function rateBooking(bookingId: string, rating: number) {
  return api.post<void>(`/bookings/${bookingId}/rate`, { rating });
}

// GET /bookings — Ride History (§ Remaining customer screens).
export function getBookings(opts: { limit?: number; offset?: number; status?: BookingStatus } = {}) {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set('limit', String(opts.limit));
  if (opts.offset != null) params.set('offset', String(opts.offset));
  if (opts.status) params.set('status', opts.status);
  const qs = params.toString();
  return api.get<Page<BookingOut>>(`/bookings${qs ? `?${qs}` : ''}`);
}
