/**
 * Renders the baked visual assets from the live 3D scenes of a running dev server:
 *
 *   public/assets/materials/renders/<fraction>.webp   product renders (transparent, 800×600)
 *   public/assets/posters/facility.webp               facility model overview (16:10)
 *   public/assets/posters/transform.webp              scroll story opening frame
 *
 * Posters are shown while WebGL loads, so the hand-off to the live scene is seamless.
 *
 *   npm run dev            # in another terminal
 *   BASE=http://localhost:3000 PLAYWRIGHT_CORE=<path> node scripts/render-assets.mjs [materials|posters]
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const BASE = process.env.BASE ?? "http://localhost:3000";
const only = process.argv[2];
const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-angle=metal", "--ignore-gpu-blocklist"],
});
const out = (p) => new URL(`../public/assets/${p}`, import.meta.url).pathname;
const hideUi = `header, footer, nextjs-portal, [data-nextjs-toast], .skip-link { display: none !important; }`;

if (!only || only === "materials") {
  mkdirSync(out("materials/renders"), { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const id of ["0-2", "0-8", "0-16", "0-32", "2-8", "8-16", "16-32", "16-64", "32-64", "64-90"]) {
    await page.goto(`${BASE}/studio?fraction=${id}`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: `${hideUi} html, body { background: transparent !important; } main > *:not(#studio) { visibility: hidden; }` });
    await page.waitForFunction(() => document.documentElement.dataset.studioReady === "1");
    await page.waitForTimeout(2500);
    const png = await page.locator("#studio canvas").screenshot({ omitBackground: true });
    const info = await sharp(png).resize(800, 600).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out(`materials/renders/${id}.webp`));
    console.log(`materials/renders/${id}.webp`, Math.round(info.size / 1024), "KB");
  }
  await ctx.close();
}

if (!only || only === "posters") {
  mkdirSync(out("posters"), { recursive: true });
  // Reduced motion jumps scenes to their settled state: deterministic, no motion blur.
  const shots = [
    { file: "facility", vp: { width: 1440, height: 900 }, dpr: 1, sel: "#anlegget", section: "#anlegget [role=img]", rm: true, wait: 4500, scroll: true, offset: 200 },
    { file: "transform", vp: { width: 1440, height: 900 }, dpr: 1, sel: "#transformasjon .sticky", section: "#transformasjon [role=img]", rm: false, wait: 5000, scroll: true, offset: 4, viewport: true },
  ];
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: s.vp, deviceScaleFactor: s.dpr, reducedMotion: s.rm ? "reduce" : "no-preference" });
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    // Hide copy and chrome; keep only the rendered scene and its backdrop.
    await page.addStyleTag({
      // Overlays are tagged data-scene-overlay; drei <Html> labels sit next to the canvas.
      content: `${hideUi} [data-scene-overlay], [role=img] canvas ~ *, #transformasjon .sticky > :not(:first-child), .grain::after { display: none !important; }`,
    });
    if (s.scroll) {
      await page.evaluate(([sel, off]) => {
        const el = document.querySelector(sel);
        window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (off ?? 0));
      }, [s.sel, s.offset ?? 0]);
    }
    await page.waitForFunction((section) => {
      const el = document.querySelector(section);
      const img = el?.matches("[role=img]") ? el : el?.querySelector("[role=img]");
      return !!img && getComputedStyle(img).opacity === "1";
    }, s.section, { timeout: 30000 });
    await page.waitForTimeout(s.wait);
    // Sticky scenes are captured from the viewport (element screenshots would re-scroll them).
    const png = s.viewport ? await page.screenshot() : await page.locator(s.section).first().screenshot();
    const w = s.vp.width * s.dpr;
    const info = await sharp(png).resize({ width: Math.min(w, 1600) }).webp({ quality: 76, effort: 6 }).toFile(out(`posters/${s.file}.webp`));
    console.log(`posters/${s.file}.webp`, `${info.width}×${info.height}`, Math.round(info.size / 1024), "KB");
    await ctx.close();
  }
}
await browser.close();
