// Typed wrappers around the reviews/reports/notifications endpoints.
import { api } from './api';

export interface ReviewIn {
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface ReviewOut {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  tags: string | null;
  direction: 'customer_to_rider' | 'rider_to_customer';
  created_at: string;
}

export function submitReview(bookingId: string, payload: ReviewIn) {
  return api.post<ReviewOut>(`/reviews/${bookingId}`, payload);
}

export function getMyReviews(written = false) {
  return api.get<ReviewOut[]>(`/reviews/mine?written=${written}`);
}

export const REPORT_REASONS = [
  'rash_driving',
  'rude_behaviour',
  'overcharging',
  'wrong_route',
  'vehicle_condition',
  'safety_concern',
  'no_show',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface ReportIn {
  booking_id?: string;
  reported_user_id: string;
  reason: ReportReason;
  details?: string;
}

export function submitReport(payload: ReportIn) {
  return api.post<{ message: string }>('/reports', payload);
}

export interface NotificationOut {
  id: string;
  title: string;
  body: string;
  category: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export function getNotifications(unreadOnly = false, limit = 30) {
  return api.get<NotificationOut[]>(`/notifications?unread_only=${unreadOnly}&limit=${limit}`);
}

export function getUnreadNotificationCount() {
  return api.get<{ unread: number }>('/notifications/unread-count');
}

export function markNotificationRead(notificationId?: string) {
  const qs = notificationId ? `?notification_id=${notificationId}` : '';
  return api.post<{ message: string }>(`/notifications/read${qs}`);
}
