import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { WS_URL } from '../constants/config';
import { tokenStore } from '../services/api';
import type { RideOffer } from '../types';

// Rider offers channel — WS /ws/riders/me (§8). One event today: a fresh offer.
export type RiderSocketEvent = { event: 'ride_offer' } & RideOffer;

const KEEPALIVE_MS = 25_000;
const BACKOFF_STEP_MS = 2_000;
const BACKOFF_MAX_MS = 15_000;
const AUTH_REJECTED_CODE = 1008;

interface Options {
  // Called after any reconnect (and on app-foreground) so the screen can
  // re-fetch GET /riders/offers — a missed push while the socket was down
  // isn't lost, just late (mirrors useBookingSocket's onResync).
  onResync?: () => void;
  // Optional last-resort poll if the socket can't hold. Never faster than 5s.
  onPoll?: () => void;
  pollMs?: number;
}

/**
 * Opens WS /ws/riders/me?token=<jwt> and keeps it alive — same
 * reconnect/backoff/keepalive/resync contract as useBookingSocket, so an
 * online rider gets pushed offers instead of polling GET /riders/offers.
 * `active` gates the connection: only open while the rider is online.
 */
export function useRiderSocket(
  active: boolean,
  onEvent: (e: RiderSocketEvent) => void,
  { onResync, onPoll, pollMs = 5_000 }: Options = {}
) {
  const eventRef = useRef(onEvent);
  const resyncRef = useRef(onResync);
  const pollRef = useRef(onPoll);
  eventRef.current = onEvent;
  resyncRef.current = onResync;
  pollRef.current = onPoll;

  useEffect(() => {
    if (!active) return;

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

      ws = new WebSocket(`${WS_URL}/ws/riders/me?token=${token}`);

      ws.onopen = () => {
        stopPoll();
        if (attempt > 0) resyncRef.current?.();
        attempt = 0;
        keepAlive = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send('ping');
        }, KEEPALIVE_MS);
      };

      ws.onmessage = (m) => {
        if (m.data === 'pong' || m.data === 'ping') return;
        try {
          eventRef.current(JSON.parse(m.data) as RiderSocketEvent);
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
  }, [active, pollMs]);
}
