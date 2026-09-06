// Typed wrappers around the Rider_backend `/admin/*` endpoints.
// Same pattern as services/rider.ts — every call goes through the shared
// `api` client, which attaches the bearer token and refreshes it on 401.
import { api } from './api';
import type { BookingStatus, RiderStatus, UserRole } from '../types';
import type {
  AdminBookingRow,
  AdminPaymentRow,
  AdminRiderRow,
  AdminUserDetail,
  AppSettingRow,
  AuditLogRow,
  BookingDetail,
  DashboardStats,
  LiveTrip,
  PendingSettlement,
  PricingRuleRow,
  PromotionInput,
  PromotionRow,
  ReportsSummary,
  RevenueRow,
  RideSearchRow,
  SafetyAlertRow,
  UserReportRow,
} from '../types/admin';
import type { UserOut } from '../types';

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const pairs = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return pairs.length ? `?${pairs.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}` : '';
};

// --- dashboard / home ------------------------------------------------------

export const getDashboardStats = () => api.get<DashboardStats>('/admin/stats');

export const getLiveTrips = () => api.get<LiveTrip[]>('/admin/trips/live');

export const getRevenue = (days = 30) => api.get<RevenueRow[]>(`/admin/revenue${qs({ days })}`);

export const getReportsSummary = (days = 30) =>
  api.get<ReportsSummary>(`/admin/reports/summary${qs({ days })}`);

export const getAuditLogs = (params: { action?: string; entity_type?: string; limit?: number; offset?: number } = {}) =>
  api.get<AuditLogRow[]>(`/admin/audit-logs${qs(params)}`);

// --- users ---------------------------------------------------------------

export const getUsers = (params: { role?: UserRole; q?: string; limit?: number; offset?: number } = {}) =>
  api.get<UserOut[]>(`/admin/users${qs(params)}`);

export const getUserDetail = (userId: string) => api.get<AdminUserDetail>(`/admin/users/${userId}`);

export const setUserRole = (userId: string, role: UserRole) =>
  api.post<UserOut>(`/admin/users/${userId}/role${qs({ role })}`);

export const deactivateUser = (userId: string) =>
  api.post<{ message: string }>(`/admin/users/${userId}/deactivate`);

export const activateUser = (userId: string) =>
  api.post<{ message: string }>(`/admin/users/${userId}/activate`);

export const searchRides = (q: string, limit = 20) =>
  api.get<RideSearchRow[]>(`/admin/search/rides${qs({ q, limit })}`);

// --- riders -------------------------------------------------------------

export const getRiders = (params: { status?: RiderStatus; limit?: number; offset?: number } = {}) =>
  api.get<AdminRiderRow[]>(`/admin/riders${qs(params)}`);

export const getRiderDetail = (riderId: string) =>
  api.get<import('../types/admin').RiderDetail>(`/admin/riders/${riderId}`);

export const getRiderDocuments = (riderId: string) =>
  api.get<import('../types/admin').RiderDocuments>(`/admin/riders/${riderId}/documents`);

export const setRiderStatus = (riderId: string, newStatus: RiderStatus) =>
  api.post<AdminRiderRow>(`/admin/riders/${riderId}/status${qs({ new_status: newStatus })}`);

// --- rides / bookings --------------------------------------------------

export const getBookings = (params: { status?: BookingStatus; limit?: number; offset?: number } = {}) =>
  api.get<AdminBookingRow[]>(`/admin/bookings${qs(params)}`);

export const getBookingDetail = (bookingId: string) =>
  api.get<BookingDetail>(`/admin/bookings/${bookingId}`);

// --- earnings ---------------------------------------------------------

export const getPendingSettlements = () =>
  api.get<PendingSettlement[]>('/admin/settlements/pending');

export const settleRider = (riderId: string, until?: string) =>
  api.post<{ rider_id: string; entries_settled: number; amount_settled: number }>(
    '/admin/settlements/settle',
    { rider_id: riderId, ...(until ? { until } : {}) }
  );

// --- payments -------------------------------------------------------

export const getPayments = (params: { status?: string; method?: string; limit?: number; offset?: number } = {}) =>
  api.get<AdminPaymentRow[]>(`/admin/payments${qs(params)}`);

// --- offers / promotions -------------------------------------------

export const getOffers = (onlyActive = false) =>
  api.get<PromotionRow[]>(`/admin/offers${qs({ only_active: onlyActive })}`);

export const createOffer = (payload: PromotionInput) =>
  api.post<PromotionRow>('/admin/offers', payload);

export const updateOffer = (offerId: string, payload: Partial<PromotionInput>) =>
  api.patch<PromotionRow>(`/admin/offers/${offerId}`, payload);

export const deleteOffer = (offerId: string) =>
  api.delete<{ message: string }>(`/admin/offers/${offerId}`);

// --- notifications --------------------------------------------------

export const broadcast = (payload: { title: string; body: string; role?: UserRole }) =>
  api.post<{ recipients: number }>('/admin/notifications/broadcast', payload);

// --- support / safety ---------------------------------------------

export const getUserReports = (status?: string) =>
  api.get<UserReportRow[]>(`/admin/user-reports${qs({ status })}`);

export const resolveUserReport = (reportId: string, resolution: string, note?: string) =>
  api.post<{ message: string }>(`/admin/user-reports/${reportId}/resolve${qs({ resolution, note })}`);

export const getSafetyAlerts = (onlyOpen = true) =>
  api.get<SafetyAlertRow[]>(`/admin/alerts${qs({ only_open: onlyOpen })}`);

// --- settings / pricing -----------------------------------------

export const getSettings = () => api.get<AppSettingRow[]>('/admin/settings');

export const putSetting = (key: string, value: Record<string, unknown>, description?: string, isPublic = false) =>
  api.put<{ key: string; value: Record<string, unknown>; is_public: boolean }>(
    `/admin/settings/${key}`,
    { value, description: description ?? null, is_public: isPublic }
  );

export const getPricing = () => api.get<PricingRuleRow[]>('/admin/pricing');

export const putPricing = (vehicleType: string, payload: Omit<PricingRuleRow, 'vehicle_type' | 'is_active'>) =>
  api.put<PricingRuleRow>(`/admin/pricing/${vehicleType}`, payload);
