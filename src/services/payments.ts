// Razorpay order creation + client-side verification (FRONTEND_INTEGRATION.md
// payments section). Only called for payment_method === 'online' bookings,
// once the trip is completed and Rider_backend has a real Payment row.
import { api } from './api';

export interface RazorpayOrder {
  payment_id: string;
  gateway_order_id: string;
  amount: number;
  currency: string;
  gateway_key_id: string;
}

export function createPaymentOrder(bookingId: string) {
  return api.post<RazorpayOrder>(`/payments/${bookingId}/order`);
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function verifyPayment(bookingId: string, payload: VerifyPaymentPayload) {
  return api.post<{ message: string }>(`/payments/${bookingId}/verify`, payload);
}
