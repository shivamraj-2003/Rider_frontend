import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { WS_URL } from '../constants/config';
import { tokenStore } from '../services/api';

// Booking channel events — WS /ws/bookings/{id} (§8).
export type BookingSocketEvent =
  | { event: 'rider_assigned'; rider_id: string; vehicle_number: string }
  | {
      event: 'location_update';
      lat: number;
      lng: number;
      speed_kmph: number;
      heading: number;
      recorded_at: string;
    }
  | { event: 'rider_arrived'; booking_id: string }
  | { event: 'trip_started'; booking_id: string }
  | { event: 'trip_completed'; fare: number }
  | { event: 'booking_cancelled'; by: 'rider' | 'customer' }
  | { event: 'no_riders_found'; booking_id: string };

const KEEPALIVE_MS = 25_000;
const BACKOFF_STEP_MS = 2_000;
const BACKOFF_MAX_MS = 15_000;
const AUTH_REJECTED_CODE = 1008;

interface Options {
  // Called after any reconnect (and on app-foreground) so the screen can
  // re-fetch GET /bookings/{id} — a missed event is gone (§8).
  onResync?: () => void;
  // Optional last-resort poll if the socket can't hold. Never faster than 5s.
  onPoll?: () => void;
  pollMs?: number;
}

/**
 * Opens WS /ws/bookings/{id}?token=<jwt> and keeps it alive:
 *  - text keepalive every 25s
 *  - reconnect with linear backoff, but never on close code 1008 (auth rejected)
 *  - onResync() after every successful reconnect and on app-foreground
 *  - optional onPoll() fallback, min 5s, only while the socket is down
 */
export function useBookingSocket(
  bookingId: string | null,
  onEvent: (e: BookingSocketEvent) => void,
  { onResync, onPoll, pollMs = 5_000 }: Options = {}
) {
  const eventRef = useRef(onEvent);
  const resyncRef = useRef(onResync);
  const pollRef = useRef(onPoll);
  eventRef.current = onEvent;
  resyncRef.current = onResync;
  pollRef.current = onPoll;

  useEffect(() => {
    if (!bookingId) return;

    let closed = false;
    let ws: WebSocket | null = null;
    let keepAlive: ReturnType<typeof setInterval> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    let attempt = 0;

    const stopPoll = () => {
      if (poll) clearInterval(poll);
      poll = undefined;
    };

    const startPoll = () => {
      if (poll || !pollRef.current) return;
      poll = setInterval(() => pollRef.current?.(), Math.max(pollMs, 5_000));
    };

    const open = async () => {
      const token = await tokenStore.getAccessToken();
      if (closed || !token) return;

      ws = new WebSocket(`${WS_URL}/ws/bookings/${bookingId}?token=${token}`);

      ws.onopen = () => {
        stopPoll();
        if (attempt > 0) resyncRef.current?.(); // catch up on anything missed
        attempt = 0;
        keepAlive = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send('ping');
        }, KEEPALIVE_MS);
      };

      ws.onmessage = (m) => {
        if (m.data === 'pong' || m.data === 'ping') return;
        try {
          eventRef.current(JSON.parse(m.data) as BookingSocketEvent);
        } catch {
          // ignore non-JSON frames
        }
      };

      ws.onclose = (e) => {
        if (keepAlive) clearInterval(keepAlive);
        keepAlive = undefined;
        if (closed || e.code === AUTH_REJECTED_CODE) return;
        attempt += 1;
        startPoll();
        setTimeout(open, Math.min(BACKOFF_STEP_MS * attempt, BACKOFF_MAX_MS));
      };
    };

    open();

    // Re-sync whenever the app returns to the foreground (§8).
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') resyncRef.current?.();
    });

    return () => {
      closed = true;
      if (keepAlive) clearInterval(keepAlive);
      stopPoll();
      appStateSub.remove();
      ws?.close();
    };
  }, [bookingId, pollMs]);
}
