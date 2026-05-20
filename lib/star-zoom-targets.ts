export type StarZoomEasing =
  | "easeInOutCubic"
  | "easeInOutQuart"
  | "easeInOutSine"
  | "easeOutCubic"
  | "easeOutQuart";

export type StarZoomTarget = {
  id: number;
  x: number;
  y: number;
  zoomScale: number;
  durationMs: number;
  easingCurve: StarZoomEasing;
  rotation: number;
  focusOffsetX: number;
  focusOffsetY: number;
  glowIntensity: number;
};

type EventLike = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
};

export const STAR_ZOOM_TARGETS: StarZoomTarget[] = [
  { id: 0, x: 2250, y: 3150, zoomScale: 2.42, durationMs: 1520, easingCurve: "easeInOutCubic", rotation: -0.018, focusOffsetX: -0.04, focusOffsetY: 0.02, glowIntensity: 0.98 },
  { id: 1, x: 3460, y: 2460, zoomScale: 2.68, durationMs: 1640, easingCurve: "easeOutQuart", rotation: 0.022, focusOffsetX: 0.03, focusOffsetY: -0.01, glowIntensity: 1.16 },
  { id: 2, x: 4860, y: 2920, zoomScale: 2.28, durationMs: 1450, easingCurve: "easeInOutSine", rotation: -0.012, focusOffsetX: 0.01, focusOffsetY: 0.05, glowIntensity: 0.9 },
  { id: 3, x: 6380, y: 2380, zoomScale: 2.82, durationMs: 1720, easingCurve: "easeInOutQuart", rotation: 0.032, focusOffsetX: -0.02, focusOffsetY: -0.03, glowIntensity: 1.28 },
  { id: 4, x: 7810, y: 3220, zoomScale: 2.5, durationMs: 1580, easingCurve: "easeOutCubic", rotation: -0.026, focusOffsetX: 0.04, focusOffsetY: 0.02, glowIntensity: 1.08 },
  { id: 5, x: 1720, y: 4380, zoomScale: 2.74, durationMs: 1680, easingCurve: "easeInOutCubic", rotation: 0.017, focusOffsetX: -0.03, focusOffsetY: -0.02, glowIntensity: 1.22 },
  { id: 6, x: 2940, y: 3880, zoomScale: 2.36, durationMs: 1490, easingCurve: "easeOutQuart", rotation: -0.034, focusOffsetX: 0.05, focusOffsetY: 0.01, glowIntensity: 0.94 },
  { id: 7, x: 4120, y: 4570, zoomScale: 2.92, durationMs: 1840, easingCurve: "easeInOutQuart", rotation: 0.008, focusOffsetX: -0.01, focusOffsetY: 0.04, glowIntensity: 1.34 },
  { id: 8, x: 5480, y: 3740, zoomScale: 2.54, durationMs: 1560, easingCurve: "easeInOutSine", rotation: -0.021, focusOffsetX: 0.02, focusOffsetY: -0.04, glowIntensity: 1.02 },
  { id: 9, x: 6930, y: 4440, zoomScale: 2.7, durationMs: 1740, easingCurve: "easeOutCubic", rotation: 0.028, focusOffsetX: -0.05, focusOffsetY: 0.02, glowIntensity: 1.24 },
  { id: 10, x: 8460, y: 3970, zoomScale: 2.18, durationMs: 1420, easingCurve: "easeInOutCubic", rotation: -0.014, focusOffsetX: 0.03, focusOffsetY: -0.01, glowIntensity: 0.88 },
  { id: 11, x: 2380, y: 5480, zoomScale: 3.02, durationMs: 1880, easingCurve: "easeInOutQuart", rotation: 0.036, focusOffsetX: 0.01, focusOffsetY: 0.03, glowIntensity: 1.42 },
  { id: 12, x: 3520, y: 5140, zoomScale: 2.46, durationMs: 1530, easingCurve: "easeOutQuart", rotation: -0.028, focusOffsetX: -0.04, focusOffsetY: -0.02, glowIntensity: 1.04 },
  { id: 13, x: 4720, y: 5880, zoomScale: 2.64, durationMs: 1660, easingCurve: "easeInOutSine", rotation: 0.014, focusOffsetX: 0.04, focusOffsetY: 0.01, glowIntensity: 1.12 },
  { id: 14, x: 6120, y: 5260, zoomScale: 2.34, durationMs: 1480, easingCurve: "easeOutCubic", rotation: -0.008, focusOffsetX: -0.02, focusOffsetY: 0.05, glowIntensity: 0.96 },
  { id: 15, x: 7620, y: 5660, zoomScale: 2.86, durationMs: 1810, easingCurve: "easeInOutCubic", rotation: 0.026, focusOffsetX: 0.03, focusOffsetY: -0.03, glowIntensity: 1.3 },
  { id: 16, x: 1510, y: 6680, zoomScale: 2.52, durationMs: 1570, easingCurve: "easeInOutQuart", rotation: -0.036, focusOffsetX: -0.01, focusOffsetY: -0.04, glowIntensity: 1.06 },
  { id: 17, x: 3160, y: 6810, zoomScale: 2.72, durationMs: 1760, easingCurve: "easeOutQuart", rotation: 0.019, focusOffsetX: 0.05, focusOffsetY: 0.02, glowIntensity: 1.2 },
  { id: 18, x: 4380, y: 7160, zoomScale: 2.24, durationMs: 1440, easingCurve: "easeInOutSine", rotation: -0.016, focusOffsetX: -0.03, focusOffsetY: 0.01, glowIntensity: 0.92 },
  { id: 19, x: 5780, y: 6590, zoomScale: 2.96, durationMs: 1860, easingCurve: "easeInOutQuart", rotation: 0.034, focusOffsetX: 0.02, focusOffsetY: -0.02, glowIntensity: 1.38 },
  { id: 20, x: 7220, y: 7040, zoomScale: 2.58, durationMs: 1610, easingCurve: "easeOutCubic", rotation: -0.024, focusOffsetX: -0.05, focusOffsetY: 0.03, glowIntensity: 1.1 },
  { id: 21, x: 8590, y: 6560, zoomScale: 2.4, durationMs: 1510, easingCurve: "easeInOutCubic", rotation: 0.011, focusOffsetX: 0.03, focusOffsetY: -0.01, glowIntensity: 1 },
  { id: 22, x: 2060, y: 2360, zoomScale: 2.78, durationMs: 1710, easingCurve: "easeOutQuart", rotation: -0.031, focusOffsetX: -0.04, focusOffsetY: -0.02, glowIntensity: 1.26 },
  { id: 23, x: 3740, y: 3290, zoomScale: 2.3, durationMs: 1460, easingCurve: "easeInOutSine", rotation: 0.016, focusOffsetX: 0.04, focusOffsetY: 0.03, glowIntensity: 0.95 },
  { id: 24, x: 5260, y: 2260, zoomScale: 2.88, durationMs: 1820, easingCurve: "easeInOutQuart", rotation: -0.006, focusOffsetX: -0.01, focusOffsetY: -0.05, glowIntensity: 1.32 },
  { id: 25, x: 6690, y: 3330, zoomScale: 2.48, durationMs: 1540, easingCurve: "easeOutCubic", rotation: 0.029, focusOffsetX: 0.02, focusOffsetY: 0.02, glowIntensity: 1.08 },
  { id: 26, x: 8040, y: 2550, zoomScale: 2.66, durationMs: 1670, easingCurve: "easeInOutCubic", rotation: -0.02, focusOffsetX: 0.05, focusOffsetY: -0.02, glowIntensity: 1.18 },
  { id: 27, x: 2540, y: 4240, zoomScale: 2.22, durationMs: 1430, easingCurve: "easeOutQuart", rotation: 0.006, focusOffsetX: -0.03, focusOffsetY: 0.04, glowIntensity: 0.9 },
  { id: 28, x: 4260, y: 3620, zoomScale: 3, durationMs: 1900, easingCurve: "easeInOutQuart", rotation: -0.038, focusOffsetX: 0.01, focusOffsetY: -0.01, glowIntensity: 1.4 },
  { id: 29, x: 5660, y: 4560, zoomScale: 2.56, durationMs: 1590, easingCurve: "easeInOutSine", rotation: 0.023, focusOffsetX: -0.04, focusOffsetY: 0.02, glowIntensity: 1.06 },
  { id: 30, x: 7360, y: 3840, zoomScale: 2.8, durationMs: 1780, easingCurve: "easeOutCubic", rotation: -0.013, focusOffsetX: 0.03, focusOffsetY: -0.04, glowIntensity: 1.25 },
  { id: 31, x: 1820, y: 5740, zoomScale: 2.44, durationMs: 1520, easingCurve: "easeInOutCubic", rotation: 0.031, focusOffsetX: -0.05, focusOffsetY: 0.01, glowIntensity: 1.02 },
  { id: 32, x: 3360, y: 6220, zoomScale: 2.84, durationMs: 1800, easingCurve: "easeOutQuart", rotation: -0.027, focusOffsetX: 0.04, focusOffsetY: 0.03, glowIntensity: 1.29 },
  { id: 33, x: 5060, y: 5480, zoomScale: 2.38, durationMs: 1500, easingCurve: "easeInOutSine", rotation: 0.012, focusOffsetX: -0.02, focusOffsetY: -0.03, glowIntensity: 0.98 },
  { id: 34, x: 6460, y: 6120, zoomScale: 2.9, durationMs: 1840, easingCurve: "easeInOutQuart", rotation: -0.033, focusOffsetX: 0.02, focusOffsetY: 0.04, glowIntensity: 1.36 },
  { id: 35, x: 8260, y: 5480, zoomScale: 2.5, durationMs: 1580, easingCurve: "easeOutCubic", rotation: 0.018, focusOffsetX: 0.04, focusOffsetY: -0.02, glowIntensity: 1.12 },
  { id: 36, x: 2240, y: 7440, zoomScale: 2.62, durationMs: 1650, easingCurve: "easeInOutCubic", rotation: -0.01, focusOffsetX: -0.01, focusOffsetY: 0.05, glowIntensity: 1.14 },
  { id: 37, x: 3840, y: 7640, zoomScale: 2.32, durationMs: 1470, easingCurve: "easeOutQuart", rotation: 0.025, focusOffsetX: 0.05, focusOffsetY: -0.03, glowIntensity: 0.94 },
  { id: 38, x: 5280, y: 7340, zoomScale: 2.76, durationMs: 1740, easingCurve: "easeInOutSine", rotation: -0.022, focusOffsetX: -0.04, focusOffsetY: 0.02, glowIntensity: 1.24 },
  { id: 39, x: 6880, y: 7720, zoomScale: 2.54, durationMs: 1600, easingCurve: "easeInOutQuart", rotation: 0.009, focusOffsetX: 0.02, focusOffsetY: -0.05, glowIntensity: 1.08 },
  { id: 40, x: 8320, y: 7360, zoomScale: 2.94, durationMs: 1870, easingCurve: "easeOutCubic", rotation: -0.029, focusOffsetX: -0.03, focusOffsetY: 0.02, glowIntensity: 1.34 },
  { id: 41, x: 2740, y: 2780, zoomScale: 2.52, durationMs: 1560, easingCurve: "easeInOutCubic", rotation: 0.035, focusOffsetX: 0.03, focusOffsetY: 0.01, glowIntensity: 1.1 },
  { id: 42, x: 4480, y: 2240, zoomScale: 2.7, durationMs: 1690, easingCurve: "easeOutQuart", rotation: -0.017, focusOffsetX: -0.02, focusOffsetY: -0.04, glowIntensity: 1.21 },
  { id: 43, x: 5920, y: 3060, zoomScale: 2.26, durationMs: 1440, easingCurve: "easeInOutSine", rotation: 0.007, focusOffsetX: 0.04, focusOffsetY: 0.03, glowIntensity: 0.91 },
  { id: 44, x: 7480, y: 2460, zoomScale: 2.98, durationMs: 1880, easingCurve: "easeInOutQuart", rotation: -0.04, focusOffsetX: -0.01, focusOffsetY: -0.02, glowIntensity: 1.44 },
  { id: 45, x: 2180, y: 4840, zoomScale: 2.46, durationMs: 1530, easingCurve: "easeOutCubic", rotation: 0.021, focusOffsetX: -0.05, focusOffsetY: 0.04, glowIntensity: 1.04 },
  { id: 46, x: 4580, y: 4860, zoomScale: 2.64, durationMs: 1660, easingCurve: "easeInOutCubic", rotation: -0.025, focusOffsetX: 0.01, focusOffsetY: -0.01, glowIntensity: 1.16 },
  { id: 47, x: 6320, y: 4840, zoomScale: 2.36, durationMs: 1480, easingCurve: "easeOutQuart", rotation: 0.015, focusOffsetX: 0.05, focusOffsetY: 0.02, glowIntensity: 0.97 },
  { id: 48, x: 7840, y: 4780, zoomScale: 2.82, durationMs: 1790, easingCurve: "easeInOutSine", rotation: -0.032, focusOffsetX: -0.03, focusOffsetY: -0.04, glowIntensity: 1.31 },
  { id: 49, x: 5160, y: 6420, zoomScale: 2.58, durationMs: 1620, easingCurve: "easeInOutQuart", rotation: 0.027, focusOffsetX: 0.02, focusOffsetY: 0.03, glowIntensity: 1.12 },
];

export function getStableStarZoomKey(event?: EventLike | string | null) {
  if (!event) {
    return null;
  }

  if (typeof event === "string") {
    return event.trim() || null;
  }

  return (
    event.id?.trim() ||
    event.slug?.trim() ||
    event.title?.trim() ||
    null
  );
}

export function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getStarZoomTargetForEvent(event?: EventLike | string | null) {
  const key = getStableStarZoomKey(event);

  if (!key) {
    return STAR_ZOOM_TARGETS[0];
  }

  return STAR_ZOOM_TARGETS[hashString(key) % STAR_ZOOM_TARGETS.length];
}
