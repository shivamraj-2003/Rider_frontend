import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';

type Snap = 'full' | 'half' | 'peek';

// Drag-to-resize for a bottom sheet that has nowhere to "go back" to (the
// Home tab's "Where are you going?" sheet sits on the root screen, not a
// pushed one) — three snap points: fully expanded, half the screen, and
// just the grab handle peeking. Needs the sheet's own rendered height (from
// onLayout) to know where "half" and "peek" land.
export function useSwipeCollapse(
  sheetHeight: number,
  {
    peekVisible = 64,
    defaultSnap = 'half',
    halfVisibleFraction = 0.5,
  }: { peekVisible?: number; defaultSnap?: Snap; halfVisibleFraction?: number } = {}
) {
  const screenHeight = Dimensions.get('window').height;
  const peekTranslate = Math.max(0, sheetHeight - peekVisible);
  const halfTranslate = Math.max(
    0,
    Math.min(peekTranslate, sheetHeight - screenHeight * halfVisibleFraction)
  );
  const offsets: Record<Snap, number> = { full: 0, half: halfTranslate, peek: peekTranslate };

  // PanResponder.create() only runs once (it's built inside useRef) — its
  // callbacks would otherwise close over whatever these offsets were on
  // that FIRST render, which is all zeros (sheetHeight isn't known until
  // onLayout fires). Keep the live values in a ref, updated every render,
  // and read that inside the gesture instead of the closed-over object.
  const offsetsRef = useRef(offsets);
  offsetsRef.current = offsets;

  const translateY = useRef(new Animated.Value(offsets[defaultSnap])).current;
  const snapRef = useRef<Snap>(defaultSnap);
  const [snap, setSnap] = useState<Snap>(defaultSnap);

  // Re-pin to the current snap's position whenever the sheet's real height
  // (or the screen size) changes - covers both the very first onLayout
  // (sheetHeight is 0 on mount, so the offsets above were a guess) and
  // later content loading in (saved places / popular list) making the
  // sheet taller. Without this, a rider/content update after mount could
  // look like the sheet "auto expanded" simply because its offset never
  // moved to match a now-taller sheet.
  useEffect(() => {
    translateY.setValue(offsets[snapRef.current]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offsets.half, offsets.peek, translateY]);

  const snapTo = (name: Snap) => {
    snapRef.current = name;
    setSnap(name);
    Animated.spring(translateY, {
      toValue: offsetsRef.current[name],
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim the responder on touch-down, not just once a drag is already
      // under way: this handle is a small dedicated strip with nothing
      // scrollable under it, and a Pressable layered on top of PanResponder
      // here fought it for the responder and swallowed the whole gesture —
      // that's why dragging did nothing. Claiming immediately also lets a
      // plain tap (see release, below) double as "go up one snap".
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, g) => {
        const o = offsetsRef.current;
        const base = o[snapRef.current];
        const next = base + g.dy;
        translateY.setValue(Math.max(o.full, Math.min(o.peek, next)));
      },
      onPanResponderRelease: (_evt, g) => {
        const o = offsetsRef.current;
        const isTap = Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6;
        const order: Snap[] = ['full', 'half', 'peek'];
        const currentIndex = order.indexOf(snapRef.current);
        if (isTap) {
          // Tap the handle to open up one notch (peek -> half -> full).
          if (currentIndex > 0) snapTo(order[currentIndex - 1]);
          return;
        }
        // A fast flick jumps one snap point in that direction regardless
        // of exactly how far it moved; otherwise land on whichever of the
        // three offsets the released position ended up closest to.
        if (g.vy > 0.8 && currentIndex < order.length - 1) {
          snapTo(order[currentIndex + 1]);
          return;
        }
        if (g.vy < -0.8 && currentIndex > 0) {
          snapTo(order[currentIndex - 1]);
          return;
        }
        const base = o[snapRef.current];
        const projected = base + g.dy;
        let nearest: Snap = 'full';
        let bestDist = Infinity;
        for (const name of order) {
          const dist = Math.abs(projected - o[name]);
          if (dist < bestDist) {
            bestDist = dist;
            nearest = name;
          }
        }
        snapTo(nearest);
      },
      onPanResponderTerminate: () => snapTo(snapRef.current),
    })
  ).current;

  return {
    panHandlers: offsets.peek > 0 ? panResponder.panHandlers : {},
    style: { transform: [{ translateY }] },
    snap,
    collapsed: snap === 'peek',
    expand: () => snapTo('full'),
  };
}
