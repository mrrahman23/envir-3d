/**
 * The whole story as pure functions of two numbers:
 *   intro  ∈ [0, 1] — time-driven Earth → Norway → Bergen flight (after the scene is ready)
 *   scroll ∈ [0, 1] — progress through the pinned hero track
 * Both the WebGL scene and the DOM overlays read these, so scrolling back reverses everything.
 */

export const INTRO_SECONDS = 7.2;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Normalised position of x inside [a, b]. */
export const range = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
export const ss = (x: number, a: number, b: number) => smooth(range(x, a, b));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Shared, mutable story state (no React state per frame). */
export type Story = {
  /** Raw scroll progress through the track (0..1). */
  scroll: number;
  /** Intro progress (0..1). */
  intro: number;
  /** Notified when the intro advances (DOM credits follow the flight). */
  listeners: Set<() => void>;
};
export const createStory = (): Story => ({ scroll: 0, intro: 0, listeners: new Set() });

// ---------------------------------------------------------------------------
// Scroll phases
export const P = {
  copyOut: [0.025, 0.11],
  descent: [0, 0.33],
  dipIn: [0.225, 0.31],
  cutaway: 0.312,
  dipOut: [0.314, 0.375],
  settle: [0.312, 0.53],
  separate: [0.6, 0.86],
  final: [0.86, 0.92],
} as const;

/** Opacity of the dissolve-through-earth overlay. */
export const dipAmount = (p: number) => (p < P.cutaway ? ss(p, P.dipIn[0], P.dipIn[1]) : 1 - ss(p, P.dipOut[0], P.dipOut[1]));
export const heroCopy = (p: number) => 1 - ss(p, P.copyOut[0], P.copyOut[1]);
export const geoCopy = (p: number) => ss(p, 0.39, 0.47);
export const finalCopy = (p: number) => ss(p, P.final[0], P.final[1]);
/** Separation of the slabs (0 closed → 1 fully exploded). */
export const separation = (p: number) => range(p, P.separate[0], P.separate[1]);
/** Per-layer lift progress with a staggered ease (top layer first). */
export const layerLift = (s: number, i: number, n: number) => smoother(range(s, (i / n) * 0.35, (i / n) * 0.35 + 0.65));
/** Label opacity for layer i. */
export const labelOpacity = (p: number, i: number) => ss(p, 0.66 + i * 0.03, 0.7 + i * 0.03);

/** Which credit applies: 0 globe (NASA), 1 Bergen (Copernicus), 2 cutaway (schematic). */
export function creditIndex(intro: number, p: number) {
  if (p >= P.cutaway) return 2;
  if (p > 0.004) return 1;
  return intro < 0.72 ? 0 : 1;
}

// ---------------------------------------------------------------------------
// Camera parameters (geographic orbit camera)
export type Geo = { lat: number; lon: number; h: number; dist: number; heading: number; pitch: number };

const START: Geo = { lat: 47, lon: 21, h: 0, dist: 26000, heading: 0, pitch: 90 };
/** Settled oblique aerial: from over Byfjorden towards the city and the mountains to the south-east. */
export const AERIAL: Geo = { lat: 60.383, lon: 5.315, h: 0, dist: 24, heading: 128, pitch: 31 };
/** Ground target at Laksevåg (subtle label only — no facility marked). */
export const LAKSEVAG = { lat: 60.3868, lon: 5.2895 };
const GROUND: Geo = { lat: LAKSEVAG.lat, lon: LAKSEVAG.lon, h: 0.05, dist: 2.3, heading: 140, pitch: 52 };

export function introPose(t: number, out: Geo): Geo {
  const sLat = smoother(range(t, 0, 0.7));
  const sDist = smoother(range(t, 0, 1));
  const sPitch = smoother(range(t, 0.5, 1));
  const sHead = smoother(range(t, 0.42, 1));
  out.lat = lerp(START.lat, AERIAL.lat, sLat);
  out.lon = lerp(START.lon, AERIAL.lon, sLat);
  out.h = 0;
  out.dist = Math.exp(lerp(Math.log(START.dist), Math.log(AERIAL.dist), sDist));
  out.pitch = lerp(START.pitch, AERIAL.pitch, sPitch);
  out.heading = lerp(START.heading, AERIAL.heading, sHead);
  return out;
}

/** Descent from wherever the intro is towards the ground at Laksevåg. */
export function descentPose(p: number, from: Geo, out: Geo): Geo {
  const s = range(p, P.descent[0], P.descent[1]);
  const sMove = smoother(s);
  // Altitude falls fastest at the end (log space), the view steepens only near the ground.
  const sDist = smooth(s);
  const sPitch = smoother(range(s, 0.55, 1));
  out.lat = lerp(from.lat, GROUND.lat, sMove);
  out.lon = lerp(from.lon, GROUND.lon, sMove);
  out.h = lerp(from.h, GROUND.h, sMove);
  out.dist = Math.exp(lerp(Math.log(from.dist), Math.log(GROUND.dist), sDist));
  out.heading = lerp(from.heading, GROUND.heading, sMove);
  out.pitch = lerp(lerp(from.pitch, 27, smooth(range(s, 0, 0.55))), GROUND.pitch, sPitch);
  return out;
}

// ---------------------------------------------------------------------------
// Cutaway orbit camera (metres, around the soil block)
export type Orbit = { az: number; el: number; dist: number; y: number };

export function cutawayPose(p: number, out: Orbit): Orbit {
  const a = smoother(range(p, P.settle[0], P.settle[1]));
  const sep = smooth(separation(p));
  // From above the turf, down past the surface to the cut faces → slow orbit while it opens.
  out.az = lerp(lerp(16, 33, a), 47, sep);
  out.el = lerp(lerp(40, 15, a), 11, sep);
  out.dist = lerp(lerp(7.4, 9.0, a), 11.6, sep);
  out.y = lerp(lerp(-0.5, -1.4, a), -0.72, sep);
  return out;
}
