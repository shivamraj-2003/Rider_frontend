// Typed wrappers around the customer-facing booking endpoints
// (FRONTEND_INTEGRATION.md §5). Kept thin — screens call these directly.
import { api } from './api';
import type { BookingLive, BookingOut, FareEstimate, PaymentMethod, Place, SavedPlace, VehicleType } from '../types';

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
