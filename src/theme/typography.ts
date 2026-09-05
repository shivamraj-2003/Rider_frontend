import { colors } from './colors';
import { font } from './fonts';

// Legacy weight-only scale — still consumed by the customer/rider/admin
// screens that predate the Phase 1 refresh. New auth UI uses `type` below.
export const typography = {
  h1: { fontSize: 30, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
};

// Phase 1 type scale (from rn/theme.js) — Plus Jakarta Sans, with colour baked
// in so a screen never needs a raw hex or font size.
export const type = {
  screenTitle: {
    fontFamily: font.extrabold,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.5,
    color: colors.navy800,
  },
  sheetTitle: {
    fontFamily: font.extrabold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: colors.navy800,
  },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 23, color: colors.ink600 },
  label: { fontFamily: font.bold, fontSize: 16, color: colors.navy800 },
  helper: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 20, color: colors.ink400 },
  mono: { fontFamily: font.medium, fontSize: 11, letterSpacing: 1.4, color: colors.ink400 },
} as const;
