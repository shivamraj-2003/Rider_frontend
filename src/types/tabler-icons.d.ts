// @tabler/icons-react-native 3.46 is published without the bundle-level
// declaration file its package "exports" map points at, so TypeScript resolves
// the bare import to the untyped .mjs and flags every icon import (TS7016).
// A bodyless ambient declaration lets all named icon imports resolve; the
// component/prop shape is provided by the local `TablerIcon` type in
// src/types/icon.ts for the few places that annotate an icon.
declare module '@tabler/icons-react-native';
