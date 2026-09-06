// Typed wrappers around the rider-facing endpoints (FRONTEND_INTEGRATION.md §6).
import { File, UploadTask } from 'expo-file-system';
import { api } from './api';
import type {
  BookingOut,
  EarningsEntry,
  EarningsSummary,
  NearbyRider,
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
  aadhaar_number: string;
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
}

export function onboardRider(payload: OnboardRiderRequest) {
  return api.post<RiderMe>('/riders/onboard', payload);
}

// A customer checking "am I already a rider" (PostAuthGate, the onboarding
// gate) treats 404 as a normal answer, not a failure - don't log it as one.
export function getRiderMe() {
  return api.get<RiderMe>('/riders/me', { silentStatuses: [404] });
}

// GET /riders/nearby — real nearby-available-rider dots for the customer's
// pre-booking map (not the dispatch pipeline).
export function getNearbyRiders(lat: number, lng: number, vehicleType?: VehicleType) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (vehicleType) params.set('vehicle_type', vehicleType);
  return api.get<NearbyRider[]>(`/riders/nearby?${params.toString()}`);
}

export type DocumentType = 'licence' | 'rc' | 'aadhaar';

export async function uploadRiderDocument(docType: DocumentType, fileUri: string, mimeType: string) {
  const { upload_url } = await api.post<{ upload_url: string }>(
    `/riders/me/documents/upload-url?doc_type=${docType}`
  );
  // expo-file-system's UploadTask streams the file straight from disk to the
  // signed URL natively - no intermediate Response.blob() (RN's Blob shim
  // round-trips the whole file through base64, which is what the
  // "Add expo-blob" warning was about).
  const result = await new UploadTask(new File(fileUri), upload_url, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': mimeType },
  }).uploadAsync();
  if (result.status < 200 || result.status >= 300) throw new Error('Document upload failed');
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
