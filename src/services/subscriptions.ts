// Customer daily-commute subscription (Home <-> Office) — typed wrappers
// around /subscriptions/*. Not the company/office subscription feature
// (that doesn't exist yet); see app/api/v1/endpoints/subscriptions.py.
import { api } from './api';
import type {
  CommuteDay,
  RoutePreview,
  Subscription,
  SubscriptionLocation,
  SubscriptionPlan,
  VehicleType,
} from '../types';

export function getSubscriptionPlans(vehicleType?: VehicleType) {
  const q = vehicleType ? `?vehicle_type=${vehicleType}` : '';
  return api.get<SubscriptionPlan[]>(`/subscriptions/plans${q}`);
}

export function previewSubscriptionRoute(
  planId: string,
  home: SubscriptionLocation,
  office: SubscriptionLocation
) {
  return api.post<RoutePreview>('/subscriptions/preview-route', { plan_id: planId, home, office });
}

// A customer with no subscription yet gets a normal 200 with a null body
// here (never a 404) - "no subscription" is an expected answer, not an
// error, so there's nothing to silence.
export function getMySubscription() {
  return api.get<Subscription | null>('/subscriptions/me');
}

export function getSubscriptionHistory() {
  return api.get<Subscription[]>('/subscriptions/history');
}

export interface CreateSubscriptionRequest {
  plan_id: string;
  home: SubscriptionLocation;
  office: SubscriptionLocation;
  days: CommuteDay[];
  pickup_time: string; // "HH:MM"
  return_time?: string | null;
}

export function createSubscription(payload: CreateSubscriptionRequest) {
  return api.post<Subscription>('/subscriptions', payload);
}

export function cancelSubscription(id: string) {
  return api.post<Subscription>(`/subscriptions/${id}/cancel`);
}

export function pauseSubscription(id: string, days: number) {
  return api.post<Subscription>(`/subscriptions/${id}/pause?days=${days}`);
}

export function resumeSubscription(id: string) {
  return api.post<Subscription>(`/subscriptions/${id}/resume`);
}

export function renewSubscription(id: string) {
  return api.post<Subscription>(`/subscriptions/${id}/renew`);
}
