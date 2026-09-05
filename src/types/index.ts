// Core domain types shared across the app.
// Mirrors the requirements in the Developer Technical Partner & Equity Agreement.

export type UserRole = 'customer' | 'rider' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
}

export type TripStatus =
  | 'requested'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Trip {
  id: string;
  customerId: string;
  riderId: string | null;
  status: TripStatus;
  pickup: LatLng & { address: string };
  destination: LatLng & { address: string };
  fare: number;
  companyCommission: number;
  riderEarning: number;
  requestedAt: string;
  completedAt: string | null;
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  currentLocation: LatLng | null;
  vehicleNumber: string;
  rating: number;
}
