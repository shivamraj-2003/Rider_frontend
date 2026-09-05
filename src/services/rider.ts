// Typed wrappers around the rider-facing endpoints (FRONTEND_INTEGRATION.md §6).
import { api } from './api';
import type {
  BookingOut,
  EarningsEntry,
  EarningsSummary,
  RiderAvailability,
  RiderMe,
  RiderStats,
  RideOffer,
  VehicleType,
} from '../types';

export interface OnboardRiderRequest {
  vehicle_type: VehicleType;
  vehicle_number: string;
  vehicle_model?: string;
  licence_number: string;
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
}

export function onboardRider(payload: OnboardRiderRequest) {
  return api.post<RiderMe>('/riders/onboard', payload);
}

export function getRiderMe() {
  return api.get<RiderMe>('/riders/me');
}

export type DocumentType = 'licence' | 'rc';

export async function uploadRiderDocument(docType: DocumentType, fileUri: string, mimeType: string) {
  const { upload_url } = await api.post<{ upload_url: string }>(
    `/riders/me/documents/upload-url?doc_type=${docType}`
  );
  const blob = await (await fetch(fileUri)).blob();
  const res = await fetch(upload_url, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': mimeType },
  });
  if (!res.ok) throw new Error('Document upload failed');
}

export function setAvailability(availability: RiderAvailability, lat?: number, lng?: number) {
  return api.post<RiderMe>('/riders/availability', { availability, lat, lng });
}

export function sendLocationPing(lat: number, lng: number, speed_kmph?: number, heading?: number) {
  return api.post<void>('/riders/location', { lat, lng, speed_kmph, heading });
}

export function getPendingOffers() {
  return api.get<RideOffer[]>('/riders/offers');
}

export function acceptOffer(bookingId: string) {
  return api.post<BookingOut>(`/riders/offers/${bookingId}/accept`);
}

export function rejectOffer(bookingId: string) {
  return api.post<void>(`/riders/offers/${bookingId}/reject`);
}

export function markArrived(bookingId: string) {
  return api.post<BookingOut>(`/bookings/${bookingId}/arrived`);
}

export function startTrip(bookingId: string) {
  return api.post<BookingOut>(`/bookings/${bookingId}/start`);
}

export function completeTrip(bookingId: string, actual_distance_km: number, actual_duration_min: number) {
  return api.post<BookingOut>(`/bookings/${bookingId}/complete`, { actual_distance_km, actual_duration_min });
}

export function collectCash(bookingId: string) {
  return api.post<void>(`/payments/${bookingId}/cash-collected`);
}

export function getRiderStats() {
  return api.get<RiderStats>('/riders/me/stats');
}

export function getEarningsSummary() {
  return api.get<EarningsSummary>('/earnings/summary');
}

export function getEarningsLedger() {
  return api.get<EarningsEntry[]>('/earnings');
}
