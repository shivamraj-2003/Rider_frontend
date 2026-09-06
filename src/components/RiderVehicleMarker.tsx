import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { VEHICLE_META } from '../types';
import type { VehicleType } from '../types';

// A nearby-rider dot, upgraded from a plain circle: the vehicle's own icon,
// rotated to face its heading, with a gentle idle float and a soft shadow
// underneath for a bit of depth — the "animated 3D-style marker" ask,
// built from the icon set already in the app rather than a new asset/lib.
export default function RiderVehicleMarker({
  vehicleType,
  heading,
}: {
  vehicleType: VehicleType;
  heading?: number | null;
}) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const Icon = VEHICLE_META[vehicleType].icon;

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.tile,
          { transform: [{ translateY }, { rotate: `${heading ?? 0}deg` }] },
        ]}
      >
        <Icon size={15} color={colors.white} strokeWidth={2.1} />
      </Animated.View>
      <View style={styles.shadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  tile: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.navy800,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F2A47',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  shadow: {
    width: 14,
    height: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(15,42,71,0.22)',
    marginTop: 2,
  },
});
