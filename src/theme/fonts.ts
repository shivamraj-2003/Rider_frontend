// Plus Jakarta Sans family names. The actual .ttf files are loaded at startup
// in App.tsx via expo-font (@expo-google-fonts/plus-jakarta-sans) under these
// exact keys, so styles can reference them synchronously.
export const font = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;
