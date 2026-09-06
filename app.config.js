// Dynamic wrapper around app.json, needed only to register the @rnmapbox/maps
// config plugin (native code — requires a dev client, Expo Go can't run it).
//
// The native SDK download itself needs a *separate* Mapbox secret credential
// (sk.* with "Downloads:Read" scope, from https://console.mapbox.com/account/access-tokens)
// — but @rnmapbox/maps reads that directly from the RNMAPBOX_MAPS_DOWNLOAD_TOKEN
// environment variable at prebuild/build time (Gradle / CocoaPods read it, not
// this file), so it never needs to appear here or in app code. Export it in
// your shell (or eas.json's `env`) before `npx expo prebuild` / `eas build`.
//
// That token is unrelated to EXPO_PUBLIC_API_URL / the backend's
// MAPBOX_PUBLIC_TOKEN (a pk.* runtime style token served from GET /config —
// safe to ship in the client bundle, used by MapCanvas.tsx at runtime).
const appJson = require('./app.json');

module.exports = () => ({
  ...appJson.expo,
  plugins: [...appJson.expo.plugins, '@rnmapbox/maps'],
});
