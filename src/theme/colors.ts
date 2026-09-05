// Top Rider brand palette, derived from the app logo (navy shield + orange pin).
// Phase 1 UI refresh: brand navy is #0B1B2D and the single accent / active
// colour is orange #E8792B (see rn/theme.js — the design source of truth).
export const colors = {
  // --- Core brand (kept keys, refreshed values) ---
  primary: '#0B1B2D',
  primaryDark: '#071322',
  primaryLight: '#1B4470',
  accent: '#E8792B',
  accentDark: '#C9631B',

  background: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E6E9ED',

  textPrimary: '#0F2A47',
  textSecondary: '#5A6B7D',
  textInverse: '#FFFFFF',
  placeholder: '#8A98A6',

  success: '#1F9D55',
  danger: '#D14343',
  warning: '#D97706',

  // --- Phase 1 design tokens (from rn/theme.js) ---
  navy900: '#0B1B2D',
  navy800: '#0F2A47',
  navy600: '#1B4470',
  navySoft: '#132F4F',
  accentTint: '#FDF1E7',
  accentFaint: '#FFFBF7',
  ink600: '#5A6B7D',
  ink400: '#8A98A6',
  line300: '#DFE3E8',
  line200: '#E6E9ED',
  line100: '#EDF0F3',
  surface50: '#F7F8FA',
  surface100: '#F2F4F7',
  white: '#FFFFFF',
  mapBase: '#E8EBEF',
  mapGrid: '#DFE3E8',
} as const;
