# Rider — Frontend (React Native / Expo)

Single mobile app for the ride-booking business, covering all three user roles
in one codebase per the Developer Technical Partner & Equity Agreement:

- **Customer** — book rides, view ride history, manage account
- **Rider** — go online/offline, handle active trips, view earnings
- **Admin** — dashboard, riders, trips/bookings overview

## Stack

- Expo (managed workflow) + TypeScript
- React Navigation (bottom tabs per role + a root switcher based on logged-in role)
- AsyncStorage for local session persistence (placeholder auth for now)

## Structure

```
src/
  components/     shared UI (ScreenScaffold, InfoCard, ...)
  constants/      config such as API_BASE_URL
  context/        AuthContext (role + session state)
  navigation/      RootNavigator + one navigator per role
  screens/
    auth/         role selection / sign-in
    customer/     customer-facing screens
    rider/        rider-facing screens
    admin/        admin-facing screens
  services/       API clients (to be added)
  types/          shared domain types (Trip, RiderProfile, UserRole, ...)
```

## Getting started

```bash
npm install
npm run android   # or: npm run ios / npm run web
```

On first launch, pick a role on the Role Select screen — this is a placeholder
sign-in (no backend call yet) so each role's UI can be previewed immediately.

## Next steps

- Wire `src/services/` to the real API in `Rider_backend` (replace the demo
  `signIn` in `AuthContext` with real authentication).
- Add maps + live location: `react-native-maps`, `expo-location`.
- Add push/real-time updates for ride requests (e.g. sockets) for the Rider role.
- Build out booking flow, pricing, and payment integration per Agreement §3.
