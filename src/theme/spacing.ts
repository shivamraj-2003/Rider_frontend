// Legacy spacing scale — used across the pre-refresh screens. Keep values.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Phase 1 spacing scale (from rn/theme.js). Slightly tighter rhythm used by the
// refreshed auth screens.
export const space = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
  // Phase 1 radii (from rn/theme.js)
  sheet: 28,
  card: 20,
  control: 18,
  input: 16,
  tile: 14,
} as const;

// Phase 1 shadow tokens (from rn/theme.js).
export const shadow = {
  card: {
    shadowColor: '#0F2A47',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sheet: {
    shadowColor: '#0F2A47',
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -12 },
    elevation: 16,
  },
  accent: {
    shadowColor: '#E8792B',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
