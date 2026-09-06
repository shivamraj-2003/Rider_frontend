import { useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

// Drag-down-to-close for a bottom sheet / pushed screen, e.g. "Where do you
// want to go?" or "Choose a ride" — built on core RN (PanResponder +
// Animated), no new native dependency, so it works in Expo Go too.
//
// Attach `panHandlers` to the draggable zone (a header/grab handle, or the
// whole sheet if nothing inside needs its own vertical scroll) and `style`
// to the Animated.View that should slide with the gesture.
export function useSwipeDismiss(onDismiss?: () => void) {
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_evt, g) =>
        !!onDismiss && g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_evt, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_evt, g) => {
        const shouldDismiss = g.dy > 110 || g.vy > 0.9;
        if (shouldDismiss && onDismiss) {
          Animated.timing(translateY, {
            toValue: 700,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onDismiss();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    })
  ).current;

  return {
    panHandlers: onDismiss ? panResponder.panHandlers : {},
    style: { transform: [{ translateY }] },
  };
}
