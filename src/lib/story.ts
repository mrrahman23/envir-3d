/**
 * Shared timing for the scroll-driven transformation story, used by both the
 * DOM copy and the 3D camera so they can never drift apart.
 */

export const STAGES = 5;

/**
 * Maps raw scroll progress (0–1) to a continuous stage phase (0–4).
 * Motion slows near each station (speed 0.45×) and speeds up between them
 * (1.55×), but never stops — one continuous move, no stop-go jumps.
 */
export function storyPhase(p: number) {
  const s = Math.min(1, Math.max(0, p)) * (STAGES - 1);
  return s - (Math.sin(2 * Math.PI * s) / (2 * Math.PI)) * 0.55;
}

/** 0 on dark industrial stages, 1 in the bright final "new life" stage. */
export function storyLight(phase: number) {
  const t = Math.min(1, Math.max(0, (phase - 3.25) / 0.6));
  return t * t * (3 - 2 * t);
}
