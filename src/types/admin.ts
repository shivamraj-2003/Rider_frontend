// TS mirrors of the Rider_backend `/admin/*` responses.
// Keep in sync with app/api/v1/endpoints/admin.py.
import type {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  RiderStatus,
  UserOut,
  UserRole,
  VehicleType,
} from './index';

// GET /admin/stats
export interface DashboardStats {
  active_bookings: number;
  active_trips: number;
  completed_today: number;
  cancelled_today: number;
  riders_online: number;
  riders_on_trip: number;
  riders_pending_verification: number;
  open_safety_alerts: number;
  revenue_today: number;
  commission_today: number;
  total_users: number;
  total_riders: number;
  total_completed: number;
  total_cancelled: number;
  rider_earnings_today: number;
}

// GET /admin/trips/live
export interface LiveTrip {
  booking_id: string;
  reference: string;
  status: BookingStatus;
  rider_id: string | null;
  lat: number | null;
  lng: number | null;
  pickup_address: string | null;
  drop_address: string | null;
}

// GET /admin/revenue
export interface RevenueRow {
  day: string;
  trips: number;
  gross: number;
  commission: number;
  rider_payouts: number;
}

// GET /admin/users/{id}
export interface AdminUserDetail {
  user: UserOut;
  rider_id: string | null;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_spent: number;
  member_since: string;
}

// GET /admin/riders — RiderOut
export interface AdminRiderRow {
  id: string;
  user_id: string;
  status: RiderStatus;
  availability: 'offline' | 'online' | 'on_trip';
  vehicle_type: VehicleType;
  vehicle_number: string | null;
  total_trips: number;
  rating: number | null;
}

// GET /admin/riders/{id}
export interface RiderDetail {
  rider: AdminRiderRow & Record<string, unknown>;
  user: UserOut | null;
  vehicle: {
    vehicle_type: VehicleType;
    vehicle_number: string | null;
    vehicle_model: string | null;
    licence_number: string | null;
  };
  bank: { account_holder: string | null; account_number: string | null; ifsc: string | null };
  total_trips: number;
  cancelled_trips: number;
  rating: number | null;
  lifetime_earnings: number;
  lifetime_commission: number;
  documents_uploaded: { licence: boolean; rc: boolean };
}

// GET /admin/riders/{id}/documents
export interface RiderDocuments {
  licence: string | null;
  rc: string | null;
  aadhaar: string | null;
}

// GET /admin/bookings — BookingOut
export interface AdminBookingRow {
  id: string;
  reference: string;
  status: BookingStatus;
  customer_id: string;
  rider_id: string | null;
  vehicle_type: VehicleType;
  pickup_address: string | null;
  drop_address: string | null;
  quoted_fare: number | null;
  final_fare: number | null;
  payment_method: PaymentMethod;
  created_at: string;
}

// GET /admin/bookings/{id}
export interface BookingDetail {
  booking: AdminBookingRow & Record<string, unknown>;
  timeline: {
    created_at: string;
    assigned_at: string | null;
    arrived_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
  };
  offers: {
    rider_id: string;
    outcome: string;
    distance_km: number | null;
    offered_at: string;
    responded_at: string | null;
  }[];
  payments: {
    id: string;
    amount: number;
    method: string;
    status: string;
    paid_at: string | null;
  }[];
}

// GET /admin/audit-logs
export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}

// GET /admin/settlements/pending
export interface PendingSettlement {
  rider_id: string;
  pending_entries: number;
  amount_due: number;
  last_trip_at: string;
}

// GET /admin/payments
export interface AdminPaymentRow {
  id: string;
  booking_id: string;
  reference: string;
  customer_name: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

// GET /admin/offers
export interface PromotionRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  max_discount: number | null;
  min_fare: number | null;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface PromotionInput {
  code: string;
  title: string;
  description?: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  max_discount?: number | null;
  min_fare?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  usage_limit?: number | null;
  is_active?: boolean;
}

// GET /admin/reports/summary
export interface ReportsSummary {
  period_days: number;
  rides_by_status: Partial<Record<BookingStatus, number>>;
  total_rides: number;
  completion_rate: number | null;
  gross_revenue: number;
  company_commission: number;
  rider_payouts: number;
  paid_trips: number;
  average_fare: number | null;
  top_riders: { rider_id: string; trips: number; earnings: number }[];
}

// GET /admin/settings
export interface AppSettingRow {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

// GET /admin/pricing — PricingRuleOut
export interface PricingRuleRow {
  vehicle_type: VehicleType;
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  minimum_fare: number;
  commission_percent: number;
  cancellation_fee: number;
  free_waiting_minutes: number;
  waiting_charge_per_minute: number;
  surge_multiplier: number;
  is_active: boolean;
}

// GET /admin/alerts
export interface SafetyAlertRow {
  id: string;
  booking_id: string | null;
  alert_type: string;
  lat: number | null;
  lng: number | null;
  resolution_status: string;
  created_at: string;
}

// GET /admin/user-reports
export interface UserReportRow {
  id: string;
  booking_id: string | null;
  reporter_user_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

// GET /admin/search/rides
export interface RideSearchRow {
  booking_id: string;
  reference: string;
  status: BookingStatus;
  customer: string | null;
  fare: number;
  created_at: string;
}

export type { UserRole };
