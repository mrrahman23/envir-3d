/**
 * Bakes the procedural soil-strata texture (src/three/strata.ts) to
 * public/textures/strata.webp so visitors don't spend main-thread time drawing it.
 *
 * Requires Node ≥ 23 (built-in TypeScript type stripping) and a Chromium browser:
 *   npx -y -p playwright-core@1.56.1 node scripts/bake-strata.mjs
 *   CHROME_PATH=/path/to/chrome node scripts/bake-strata.mjs   (to pick a browser)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const strip = (file) =>
  stripTypeScriptTypes(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");

const code = strip("src/three/noise.ts") + strip("src/three/strata.ts");
const { chromium } = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
const dataUrl = await page.evaluate(`(() => { ${code}; return drawStrata().toDataURL("image/webp", 0.86); })()`);
await browser.close();
const out = new URL("../public/textures/strata.webp", import.meta.url);
writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(`wrote ${out.pathname} (${Math.round(readFileSync(out).length / 1024)} KB)`);
