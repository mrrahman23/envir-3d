/**
 * Bakes the Earth cross-section textures from CC0 Poly Haven scans:
 *   public/assets/earth/strata-albedo.webp  (colour)
 *   public/assets/earth/strata-normal.webp  (OpenGL normal map)
 *
 * Each geological layer is filled with a real scanned surface, separated by
 * warped, seamlessly tiling boundaries, with roots and a turf fringe on top.
 * Canvas y = 0 is the ground surface.
 *
 *   node scripts/bake-earth.mjs <dir-with-polyhaven-1k-jpgs>
 * Needs playwright-core (PLAYWRIGHT_CORE=path) and Chrome (CHROME_PATH).
 * Source files are named "<asset>__Diffuse.jpg" / "<asset>__nor_gl.jpg".
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/bake-earth.mjs <texture-dir>");

// to = lower boundary (fraction of height), scale = tile size relative to 1k source.
const LAYERS = [
  { id: "forrest_ground_01", to: 0.05, scale: 0.42, tint: "#5e6b3e", tintAlpha: 0.35, roots: true },
  { id: "brown_mud_rocks_01", to: 0.24, scale: 0.5, tint: "#3b2a1c", tintAlpha: 0.25, roots: true },
  { id: "brown_mud_dry", to: 0.41, scale: 0.55, tint: "#7a5236", tintAlpha: 0.3 },
  { id: "coast_sand_01", to: 0.54, scale: 0.4, tint: "#b39466", tintAlpha: 0.2 },
  { id: "sandy_gravel_02", to: 0.75, scale: 0.42, tint: "#6c6a66", tintAlpha: 0.35, desat: 0.6 },
  { id: "rock_face_03", to: 1.0, scale: 0.8, tint: "#3f4346", tintAlpha: 0.55, desat: 0.85 },
];

const dataUrl = (f) => "data:image/jpeg;base64," + readFileSync(join(src, f)).toString("base64");
const images = Object.fromEntries(LAYERS.flatMap((l) => [[l.id + "_d", dataUrl(`${l.id}__Diffuse.jpg`)], [l.id + "_n", dataUrl(`${l.id}__nor_gl.jpg`)]]));

const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();

const out = await page.evaluate(
  async ({ LAYERS, images }) => {
    const W = 768;
    const H = 1728;
    const load = (u) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = u; });
    const img = {};
    for (const [k, u] of Object.entries(images)) img[k] = await load(u);

    // Deterministic PRNG + periodic value noise so the texture tiles horizontally.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    const noise1 = (x, period) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = hash(((i % period) + period) % period, 3), b = hash((((i + 1) % period) + period) % period, 3); return a + (b - a) * u; };
    const boundary = (li, x) => {
      const t = x / W;
      let v = 0, amp = 1, f = 3 + li;
      for (let o = 0; o < 3; o++) { v += (noise1(t * f + li * 17.3, f) - 0.5) * amp; amp *= 0.42; f *= 2; }
      return v * 0.05 * H;
    };
    const edge = LAYERS.map((l, li) => Float32Array.from({ length: W + 1 }, (_, x) => l.to * H + (li === LAYERS.length - 1 ? 0 : boundary(li, x))));

    const make = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return [c, c.getContext("2d")]; };
    const [ca, a] = make();
    const [cn, n] = make();

    const bandPath = (ctx, li) => {
      ctx.beginPath();
      const top = li === 0 ? null : edge[li - 1];
      for (let x = 0; x <= W; x++) ctx.lineTo(x, top ? top[x] - 2 : 0);
      for (let x = W; x >= 0; x--) ctx.lineTo(x, edge[li][x] + 2);
      ctx.closePath();
    };

    LAYERS.forEach((l, li) => {
      for (const [ctx, key] of [[a, "_d"], [n, "_n"]]) {
        const pat = ctx.createPattern(img[l.id + key], "repeat");
        pat.setTransform(new DOMMatrix().scale(l.scale * 0.75, l.scale * 0.75).translate(li * 137, li * 211));
        ctx.save();
        bandPath(ctx, li);
        ctx.clip();
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, W, H);
        if (key === "_d") {
          if (l.desat) {
            ctx.globalCompositeOperation = "saturation";
            ctx.globalAlpha = l.desat;
            ctx.fillStyle = "#808080";
            ctx.fillRect(0, 0, W, H);
          }
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = l.tintAlpha;
          ctx.fillStyle = l.tint;
          ctx.fillRect(0, 0, W, H);
          // Depth darkening within each layer reads as compaction.
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          const y0 = li === 0 ? 0 : LAYERS[li - 1].to * H;
          const g = ctx.createLinearGradient(0, y0, 0, l.to * H);
          g.addColorStop(0, "rgba(0,0,0,0)");
          g.addColorStop(1, "rgba(0,0,0,0.18)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }
        ctx.restore();
      }
    });

    // Pebbles cut from the scanned rock texture: dense in the gravel band, sparse in clay and bedrock.
    const pebbleFill = a.createPattern(img["rock_face_03_d"], "repeat");
    const nPebble = n.createPattern(img["rock_face_03_n"], "repeat");
    const bands = [
      { li: 2, count: 60, size: [2, 5] },
      { li: 4, count: 900, size: [2.5, 10] },
      { li: 5, count: 28, size: [6, 16] },
    ];
    for (const b of bands) {
      for (let p = 0; p < b.count; p++) {
        const x = rnd() * W;
        const xi = Math.round(x);
        const top = edge[b.li - 1][Math.min(W, xi)];
        const bot = edge[b.li][Math.min(W, xi)];
        const y = top + 6 + rnd() * Math.max(1, bot - top - 12);
        const r = b.size[0] + Math.pow(rnd(), 1.6) * (b.size[1] - b.size[0]);
        const sides = 6 + Math.floor(rnd() * 3), rot = rnd() * Math.PI, sx = 0.8 + rnd() * 0.5, sy = 0.55 + rnd() * 0.35;
        const jit = Array.from({ length: sides }, () => 0.75 + rnd() * 0.4);
        const shape = (ctx, ox) => {
          ctx.beginPath();
          for (let k = 0; k < sides; k++) {
            const ang = rot + (k / sides) * Math.PI * 2;
            ctx.lineTo(x + ox + Math.cos(ang) * r * jit[k] * sx, y + Math.sin(ang) * r * jit[k] * sy);
          }
          ctx.closePath();
        };
        const tone = b.li === 5 ? 0.55 + rnd() * 0.3 : 0.7 + rnd() * 0.4;
        for (const ox of [0, -W, W]) {
          if (x + ox < -30 || x + ox > W + 30) continue;
          // contact shadow
          a.save(); a.translate(r * 0.25, r * 0.3); shape(a, ox); a.fillStyle = "rgba(0,0,0,0.45)"; a.filter = "blur(1.5px)"; a.fill(); a.restore();
          a.save(); shape(a, ox); a.clip();
          pebbleFill.setTransform(new DOMMatrix().translate(rnd() * 900, rnd() * 900).scale(0.5, 0.5));
          a.fillStyle = pebbleFill; a.fillRect(x + ox - r * 2, y - r * 2, r * 4, r * 4);
          a.globalCompositeOperation = "saturation"; a.globalAlpha = 0.7; a.fillStyle = "#808080"; a.fillRect(x + ox - r * 2, y - r * 2, r * 4, r * 4);
          a.globalCompositeOperation = tone > 1 ? "screen" : "multiply"; a.globalAlpha = Math.abs(tone - 1) * 1.4;
          a.fillStyle = tone > 1 ? "#ffffff" : "#000000"; a.fillRect(x + ox - r * 2, y - r * 2, r * 4, r * 4);
          a.globalCompositeOperation = "source-over"; a.globalAlpha = 1;
          const hl = a.createRadialGradient(x + ox - r * 0.35, y - r * 0.4, 0, x + ox, y, r * 1.3);
          hl.addColorStop(0, "rgba(255,255,255,0.28)"); hl.addColorStop(0.5, "rgba(255,255,255,0)"); hl.addColorStop(1, "rgba(0,0,0,0.35)");
          a.fillStyle = hl; a.fillRect(x + ox - r * 2, y - r * 2, r * 4, r * 4);
          a.restore();
          n.save(); shape(n, ox); n.clip(); n.fillStyle = nPebble; n.fillRect(x + ox - r * 2, y - r * 2, r * 4, r * 4); n.restore();
        }
      }
    }

    // Soft dark seam along each boundary (moisture / transition zone).
    for (let li = 0; li < LAYERS.length - 1; li++) {
      a.save();
      a.strokeStyle = "rgba(20,14,10,0.35)";
      a.lineWidth = 7;
      a.filter = "blur(4px)";
      a.beginPath();
      for (let x = 0; x <= W; x++) a.lineTo(x, edge[li][x]);
      a.stroke();
      a.restore();
    }

    // Roots descending from the surface through the top layers.
    a.save();
    for (let r = 0; r < 52; r++) {
      let x = rnd() * W;
      let y = rnd() * 0.04 * H;
      let w = 1 + rnd() * 2.2;
      const maxY = (0.12 + rnd() * 0.2) * H;
      a.strokeStyle = `rgba(${170 + rnd() * 40},${140 + rnd() * 30},${100 + rnd() * 30},${0.55 + rnd() * 0.3})`;
      a.lineCap = "round";
      while (y < maxY && w > 0.3) {
        const nx = x + (rnd() - 0.5) * 7;
        const ny = y + 3 + rnd() * 5;
        a.lineWidth = w;
        a.beginPath();
        a.moveTo(x, y);
        a.lineTo(nx, ny);
        a.stroke();
        if (rnd() < 0.06) {
          let bx = nx, by = ny, bw = w * 0.6;
          for (let s = 0; s < 10 && bw > 0.3; s++) {
            const tx = bx + (rnd() - 0.3) * 9, ty = by + 2 + rnd() * 4;
            a.lineWidth = bw; a.beginPath(); a.moveTo(bx, by); a.lineTo(tx, ty); a.stroke();
            bx = tx; by = ty; bw *= 0.85;
          }
        }
        x = nx; y = ny; w *= 0.975;
      }
    }
    a.restore();

    // Turf fringe at the very top.
    a.save();
    for (let i = 0; i < 1200; i++) {
      const x = rnd() * W, h = 3 + rnd() * 12;
      a.strokeStyle = `rgba(${50 + rnd() * 40},${70 + rnd() * 50},${30 + rnd() * 20},0.9)`;
      a.lineWidth = 1 + rnd();
      a.beginPath(); a.moveTo(x, 0); a.lineTo(x + (rnd() - 0.5) * 4, h); a.stroke();
    }
    a.restore();

    // Normal detail survives at half resolution; it saves the most bytes.
    const ch = document.createElement("canvas");
    ch.width = W / 2; ch.height = H / 2;
    ch.getContext("2d").drawImage(cn, 0, 0, W / 2, H / 2);
    return { albedo: ca.toDataURL("image/webp", 0.66), normal: ch.toDataURL("image/webp", 0.62) };
  },
  { LAYERS, images },
);
await browser.close();

const dir = new URL("../public/assets/earth/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [k, v] of Object.entries(out)) {
  const f = new URL(`strata-${k}.webp`, dir);
  writeFileSync(f, Buffer.from(v.split(",")[1], "base64"));
  console.log(`wrote ${f.pathname} (${Math.round(readFileSync(f).length / 1024)} KB)`);
}
