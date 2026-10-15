/**
 * Bakes the hero's derived assets.
 *
 *   node scripts/bake-hero-posters.mjs dem
 *     public/assets/geo/bergen-dem-detail-256.webp — the 6 km Laksevåg DEM as lossless WebP.
 *     R = high byte, G = low byte of the 16-bit source (bergen-dem-detail-256.png), B = R.
 *     R alone is a valid 8-bit DEM (metres ≈ R / 255 * 473); (R * 256 + G) / 65535 * 473 is exact.
 *
 *   BASE=http://localhost:3200 PLAYWRIGHT_CORE=<path>/playwright-core/index.mjs node scripts/bake-hero-posters.mjs posters
 *     Captures frames of the live hero scene (UI hidden) on a running dev server:
 *     public/assets/geo/hero-poster-{desktop 1440×900, mobile 780×1688}.webp — the intro's first frame
 *       (globe; shown under the canvas while WebGL starts, so the hand-off is seamless)
 *     public/assets/geo/hero-aerial-{desktop,mobile}.webp — the settled Bergen aerial
 *       (rendered from Sentinel-2 + Copernicus DEM; used for reduced motion / no WebGL)
 *
 *   node scripts/bake-hero-posters.mjs turf
 *     public/assets/geo/turf-{albedo,normal}-512.webp — 512 px turf maps for the low (phone) tier,
 *     downsampled from public/assets/geology/turf-*-1k.webp (Poly Haven, CC0). The other layers
 *     already ship 512 albedos; the turf top needs its relief to not read as a flat plane.
 */
import sharp from "sharp";

const out = (p) => new URL(`../public/assets/geo/${p}`, import.meta.url).pathname;
const mode = process.argv[2];

if (mode === "turf") {
  const src = (p) => new URL(`../public/assets/geology/${p}`, import.meta.url).pathname;
  for (const [name, opts] of [
    ["albedo", { quality: 80, effort: 6 }],
    // Normals: high quality, no chroma subsampling (keeps the vectors clean).
    ["normal", { quality: 88, effort: 6, smartSubsample: false, sharpYuv: true }],
  ]) {
    const r = await sharp(src(`turf-${name}-1k.webp`)).resize(512, 512, { kernel: "lanczos3" }).webp(opts).toFile(out(`turf-${name}-512.webp`));
    console.log(`turf-${name}-512.webp`, r.size, "bytes");
  }
} else if (mode === "dem") {
  const { data, info } = await sharp(out("bergen-dem-detail-256.png")).toColourspace("grey16").raw({ depth: "ushort" }).toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  const rgb = Buffer.alloc(px * 3);
  const v16 = new Uint16Array(data.buffer, data.byteOffset, px * info.channels);
  for (let i = 0; i < px; i++) {
    const v = v16[i * info.channels];
    rgb[i * 3] = v >> 8;
    rgb[i * 3 + 1] = v & 255;
    rgb[i * 3 + 2] = v >> 8;
  }
  const r = await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } })
    .webp({ lossless: true, effort: 6 })
    .toFile(out("bergen-dem-detail-256.webp"));
  console.log("bergen-dem-detail-256.webp", r.size, "bytes");
} else if (mode === "posters") {
  const BASE = process.env.BASE ?? "http://localhost:3000";
  const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--use-angle=metal", "--ignore-gpu-blocklist"],
  });
  const hide = `header, footer, nextjs-portal, [data-scene-overlay], [data-scene-scrim] { display: none !important; } .grain::before, .grain::after { display: none !important; }`;
  const shots = [
    { name: "desktop", viewport: { width: 1440, height: 900 }, scale: 1 },
    { name: "mobile", viewport: { width: 390, height: 844 }, scale: 2 },
  ];
  for (const s of shots) {
    for (const [intro, file] of [
      [0, `hero-poster-${s.name}.webp`],
      [1, `hero-aerial-${s.name}.webp`],
    ]) {
      const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.scale });
      // Freeze the intro at a given progress (read by the scene driver).
      await ctx.addInitScript((t) => {
        window.__envirHeroIntro = t;
      }, intro);
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: hide });
      await page.waitForFunction(() => document.documentElement.dataset.heroScene === "ready", null, { timeout: 60000 });
      await page.waitForTimeout(4000);
      const png = await page.locator("section[aria-labelledby=hero-title] canvas").first().screenshot();
      const w = s.viewport.width * s.scale;
      const h = s.viewport.height * s.scale;
      const r = await sharp(png).resize(w, h).webp({ quality: 80, effort: 6 }).toFile(out(file));
      console.log(file, `${w}×${h}`, Math.round(r.size / 1024), "KB");
      await ctx.close();
    }
  }
  await browser.close();
} else {
  console.log("usage: node scripts/bake-hero-posters.mjs dem|posters");
}
