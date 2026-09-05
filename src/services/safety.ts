// Typed wrappers around the safety endpoints (SOS, emergency contacts, trip share).
import { api } from './api';
import type { SafetyAlertType } from '../types';

export interface AlertCreate {
  booking_id?: string;
  alert_type?: SafetyAlertType;
  lat?: number;
  lng?: number;
  details?: Record<string, unknown>;
}

export interface AlertContact {
  name: string;
  phone: string;
}

export function raiseAlert(payload: AlertCreate) {
  return api.post<{ id: string; status: string; contacts_to_notify: AlertContact[] }>('/safety/alerts', payload);
}

export interface MyAlert {
  id: string;
  alert_type: SafetyAlertType;
  booking_id: string | null;
  resolution_status: string;
  created_at: string;
}

export function getMyAlerts(limit = 20) {
  return api.get<MyAlert[]>(`/safety/alerts/mine?limit=${limit}`);
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  notify_on_sos: boolean;
}

export function getEmergencyContacts() {
  return api.get<EmergencyContact[]>('/safety/contacts');
}

export function addEmergencyContact(payload: {
  name: string;
  phone: string;
  relationship?: string;
  notify_on_sos?: boolean;
}) {
  return api.post<EmergencyContact>('/safety/contacts', payload);
}

export function deleteEmergencyContact(contactId: string) {
  return api.delete<{ message: string }>(`/safety/contacts/${contactId}`);
}

export interface ShareOut {
  token: string;
  url_path: string;
  expires_at: string;
}

export function shareTrip(bookingId: string) {
  return api.post<ShareOut>(`/safety/share/${bookingId}`);
}

export function stopSharingTrip(bookingId: string) {
  return api.delete<{ message: string }>(`/safety/share/${bookingId}`);
}
