import { useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

// Drag-down-to-peek for a bottom sheet that has nowhere to "go back" to
// (the Home tab's "Where are you going?" sheet sits on the root screen, not
// a pushed one) — dragging it down reveals more map instead of closing
// anything, and it snaps back up on a tap or another drag. Needs the
// sheet's own rendered height (from onLayout) to know how far "peek" is.
export function useSwipeCollapse(sheetHeight: number, peekVisible: number = 64) {
  const maxTranslate = Math.max(0, sheetHeight - peekVisible);
  // PanResponder.create() only runs once (it's built inside useRef) — its
  // callbacks close over whatever `maxTranslate` was on that FIRST render,
  // which is 0 (sheetHeight isn't known until onLayout fires). Without this
  // ref they'd stay frozen at "nothing to collapse", so a drag would never
  // move the sheet at all no matter how tall it later measured. Keep the
  // live value in a ref, updated every render, and read that inside the
  // gesture instead of the closed-over parameter.
  const maxTranslateRef = useRef(maxTranslate);
  maxTranslateRef.current = maxTranslate;

  const translateY = useRef(new Animated.Value(0)).current;
  const collapsedRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);

  const snapTo = (toValue: number, isCollapsed: boolean) => {
    collapsedRef.current = isCollapsed;
    setCollapsed(isCollapsed);
    Animated.spring(translateY, { toValue, useNativeDriver: true, bounciness: 4 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim the responder on touch-down, not just once a drag is already
      // under way: this handle is a small dedicated strip with nothing
      // scrollable under it, and a Pressable layered on top of PanResponder
      // here fought it for the responder and swallowed the whole gesture —
      // that's why dragging did nothing. Claiming immediately also lets a
      // plain tap (see release, below) double as "expand".
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, g) => {
        const max = maxTranslateRef.current;
        const base = collapsedRef.current ? max : 0;
        const next = base + g.dy;
        translateY.setValue(Math.max(0, Math.min(max, next)));
      },
      onPanResponderRelease: (_evt, g) => {
        const max = maxTranslateRef.current;
        const isTap = Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6;
        if (isTap) {
          if (collapsedRef.current) snapTo(0, false); // tap the peeking handle to expand
          return;
        }
        const base = collapsedRef.current ? max : 0;
        const projected = base + g.dy;
        const shouldCollapse = projected > max / 2 || g.vy > 0.6;
        snapTo(shouldCollapse ? max : 0, shouldCollapse);
      },
      onPanResponderTerminate: () => {
        snapTo(collapsedRef.current ? maxTranslateRef.current : 0, collapsedRef.current);
      },
    })
  ).current;

  return {
    panHandlers: maxTranslate > 0 ? panResponder.panHandlers : {},
    style: { transform: [{ translateY }] },
    collapsed,
    expand: () => snapTo(0, false),
  };
}
