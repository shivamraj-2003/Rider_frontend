import React from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import MapCanvasPlaceholder from './MapCanvasPlaceholder';
import type { MapCanvasProps } from './mapCanvasTypes';
import type { AppConfig } from '../types';

// -----------------------------------------------------------------------------
// Dispatcher: renders the real Mapbox map (MapCanvasReal.tsx) wherever it can
// actually run, and the schematic MapCanvasPlaceholder everywhere else —
// principally Expo Go, which cannot load ANY custom native module, Mapbox
// included, no matter what token is configured. That's a platform capability,
// not a settings problem: real street tiles only render from a dev-client
// build (`npx expo prebuild` + `npx expo run:android`/`run:ios`, or an EAS
// dev-client build) — see MapCanvasReal.tsx's header comment.
//
// The require() below is deliberately conditional and deliberately a plain
// `require`, not a static `import` — Metro still bundles the module either
// way, but its native-module lookup only actually RUNS when this line
// executes, so gating it behind the Expo Go check is what keeps Expo Go from
// crashing on a module it can't load.
// -----------------------------------------------------------------------------

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type RealModule = {
  default: React.ComponentType<MapCanvasProps>;
  configureMapbox: (config: AppConfig) => void;
};

let real: RealModule | null = null;
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    real = require('./MapCanvasReal') as RealModule;
  } catch {
    // No dev-client native module linked yet (e.g. first run after adding
    // the package, before a prebuild) — fall back to the placeholder below
    // rather than crashing the screen.
    real = null;
  }
}

// Called once from AppConfigContext after GET /config resolves. A no-op
// under Expo Go / before the native module is linked.
export function configureMapbox(config: AppConfig): void {
  real?.configureMapbox(config);
}

export default function MapCanvas(props: MapCanvasProps) {
  const Comp = real?.default ?? MapCanvasPlaceholder;
  return <Comp {...props} />;
}
