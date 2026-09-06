import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

type LatLng = { lat: number; lng: number };

const DEFAULT_DURATION_MS = 1200;

// Rider markers were snapping straight from one GPS fix to the next — this
// tweens the displayed position between them instead, so a marker glides
// A -> B rather than teleporting every poll/ping. JS-driven (useNativeDriver
// can't animate plain numbers we read back), but the interpolation itself is
// just arithmetic, so it stays cheap even at a few pings a second.
export function useSmoothLatLng(
  target: LatLng | null | undefined,
  durationMs: number = DEFAULT_DURATION_MS
): LatLng | null {
  const [pos, setPos] = useState<LatLng | null>(target ?? null);
  const progress = useRef(new Animated.Value(1)).current;
  const from = useRef<LatLng | null>(target ?? null);
  const to = useRef<LatLng | null>(target ?? null);

  useEffect(() => {
    if (!target) {
      setPos(null);
      from.current = null;
      to.current = null;
      return;
    }
    // First fix, or resuming after a gap - snap instead of animating from
    // stale/null data.
    if (!from.current) {
      from.current = target;
      to.current = target;
      setPos(target);
      return;
    }
    from.current = to.current ?? target;
    to.current = target;

    progress.setValue(0);
    const listenerId = progress.addListener(({ value }) => {
      const f = from.current;
      const t = to.current;
      if (!f || !t) return;
      setPos({
        lat: f.lat + (t.lat - f.lat) * value,
        lng: f.lng + (t.lng - f.lng) * value,
      });
    });

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    });
    anim.start();

    return () => {
      progress.removeListener(listenerId);
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.lat, target?.lng]);

  return pos;
}
