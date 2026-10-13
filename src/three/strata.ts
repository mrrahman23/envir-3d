import { fbm, mulberry32, valueNoise } from "./noise.ts";

/*
 * Soil cross-section strata drawn with Canvas 2D. Dependency-free so it can be
 * baked to public/textures/strata.webp by scripts/bake-strata.mjs — the site
 * loads the baked image instead of spending main-thread time drawing it.
 * Canvas y=0 is the surface; v=1 on the geometry maps to the top.
 */

type Layer = { to: number; color: [number, number, number]; pebbles?: number; pebbleSize?: [number, number]; roots?: boolean; cracks?: boolean };

export function drawStrata(): HTMLCanvasElement {
  const W = 512;
  const H = 1280;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(7);
  const layers: Layer[] = [
    { to: 0.035, color: [46, 64, 34], roots: true },
    { to: 0.22, color: [44, 31, 22], roots: true, pebbles: 40, pebbleSize: [1, 3] },
    { to: 0.4, color: [92, 63, 41], pebbles: 90, pebbleSize: [1.5, 4] },
    { to: 0.53, color: [158, 128, 88], pebbles: 120, pebbleSize: [0.8, 2] },
    { to: 0.74, color: [104, 96, 86], pebbles: 620, pebbleSize: [1.5, 7] },
    { to: 1.0, color: [62, 64, 66], cracks: true, pebbles: 110, pebbleSize: [3, 12] },
  ];
  // Per-pixel base colour with wavy boundaries and fine grain.
  const img = ctx.createImageData(W, H);
  // Boundary warp only varies slowly along x — precompute per column band.
  const warpCols = new Float32Array(W * 8);
  for (let x = 0; x < W; x++) {
    // sample noise on a circle so the texture tiles horizontally without a seam
    const a = (x / W) * Math.PI * 2;
    for (let b = 0; b < 8; b++) warpCols[x * 8 + b] = (fbm(Math.cos(a) * 1.6 + b * 0.45, Math.sin(a) * 1.6 + b * 0.3, 3) - 0.5) * 0.06;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = y / H;
      const warp = warpCols[x * 8 + Math.min(7, Math.floor(v * 8))];
      const vv = v + warp;
      let L = layers[layers.length - 1];
      let prevTo = 0;
      for (const l of layers) {
        if (vv < l.to) {
          L = l;
          break;
        }
        prevTo = l.to;
      }
      const edge = Math.min(1, (vv - prevTo) * 60);
      const n = valueNoise((x % 128) / 8, y / 8) * 0.25 + rnd() * 0.45;
      const k = 0.78 + n * 0.45 - (1 - edge) * 0.12;
      const i = (y * W + x) * 4;
      img.data[i] = Math.min(255, L.color[0] * k);
      img.data[i + 1] = Math.min(255, L.color[1] * k);
      img.data[i + 2] = Math.min(255, L.color[2] * k);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Stones, roots and cracks.
  let prev = 0;
  for (const l of layers) {
    const y0 = prev * H;
    const y1 = l.to * H;
    const density = (W * H) / (384 * 768);
    for (let p = 0; p < (l.pebbles ?? 0) * density; p++) {
      const [a, b] = l.pebbleSize ?? [1, 3];
      const r = a + Math.pow(rnd(), 1.8) * (b - a);
      const px = rnd() * W;
      const py = y0 + rnd() * (y1 - y0);
      const g = 70 + rnd() * 70;
      const tint = rnd() * 22;
      const sides = 5 + Math.floor(rnd() * 4);
      const rot = rnd() * Math.PI;
      const sx = 0.8 + rnd() * 0.6;
      const sy = 0.5 + rnd() * 0.4;
      const jit = Array.from({ length: sides }, () => 0.7 + rnd() * 0.45);
      for (const ox of [0, -W, W]) {
        const cx = px + ox;
        if (cx < -b * 2 || cx > W + b * 2) continue;
        const grad = ctx.createRadialGradient(cx - r * 0.3, py - r * 0.3, r * 0.1, cx, py, r * 1.2);
        grad.addColorStop(0, `rgb(${g + tint + 16},${g + tint * 0.6 + 14},${g + 10})`);
        grad.addColorStop(1, `rgb(${(g + tint) * 0.68},${(g + tint * 0.6) * 0.68},${g * 0.66})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        for (let k = 0; k < sides; k++) {
          const ang = rot + (k / sides) * Math.PI * 2;
          const rr = r * jit[k];
          const vx = cx + Math.cos(ang) * rr * sx;
          const vy = py + Math.sin(ang) * rr * sy;
          if (k === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    if (l.roots) {
      ctx.strokeStyle = "rgba(196,164,120,0.55)";
      for (let r = 0; r < 26; r++) {
        let x = rnd() * W;
        let y = y0 + rnd() * 10;
        ctx.lineWidth = 0.6 + rnd() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const len = 20 + rnd() * 50;
        for (let s = 0; s < len; s++) {
          x += (rnd() - 0.5) * 3;
          y += 1.2 + rnd() * 1.4;
          if (y > y1 + 70) break;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    if (l.cracks) {
      ctx.strokeStyle = "rgba(20,22,24,0.6)";
      for (let r = 0; r < 18; r++) {
        let x = rnd() * W;
        let y = y0 + rnd() * (y1 - y0);
        ctx.lineWidth = 0.8 + rnd();
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 12; s++) {
          x += (rnd() - 0.5) * 30;
          y += (rnd() - 0.3) * 14;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    prev = l.to;
  }
  return c;
}
