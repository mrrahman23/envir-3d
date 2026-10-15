/**
 * Writes public/assets/manifest.json and ASSETS.md from the files in public/assets
 * plus the source/licence rules below. Run after adding or changing assets:
 *   node scripts/asset-manifest.mjs
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";

const root = new URL("../public/assets/", import.meta.url).pathname;

const PH = (asset, by) => ({ source: `Poly Haven – ${asset}${by ? ` (${by})` : ""}`, license: "CC0 1.0", url: `https://polyhaven.com/a/${asset.toLowerCase().replace(/ /g, "_")}` });
const ENVIR = { source: "Envir AS – envir.com", license: "© Envir AS (official company material)", url: "https://envir.com" };
const OWN = { source: "Custom – rendered/baked from this project's 3D scenes", license: "Project asset (Envir)", url: null };

// First matching rule wins.
const NASA = { source: "NASA Earth Observatory – Blue Marble Next Generation (Reto Stöckli)", license: "Public domain (NASA)", url: "https://visibleearth.nasa.gov/collection/1484/blue-marble" };
const S2 = { source: "Copernicus Sentinel-2 L2A (2020) via Element84 Earth Search", license: "Free and open, commercial use allowed — 'Contains modified Copernicus Sentinel data 2020'", url: "https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice" };
const DEM = { source: "Copernicus DEM GLO-30", license: "Free incl. commercial use — '© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved'", url: "https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model" };
const GEOLOGY = { "topsoil": PH("Mud Forest", "eye-candy.xyz"), "sand": PH("Dense Sand", "Dimitrios Savva"), "gravel": PH("Ganges River Pebbles", "Amal Kumar"), "mineral": PH("Gray Rocks", "Dimitrios Savva"), "bedrock": PH("Quarry Wall", "Dimitrios Savva"), "turf": PH("Grass Ground", "Charlotte Baglioni") };
const LAYER = { topsoil: "matjord", sand: "sand", gravel: "grus", mineral: "mineralmasse", bedrock: "berggrunn", turf: "gress-overflate" };

// First matching rule wins. Rules may be functions of the file name for per-file sources.
const RULES = [
  [/^geo\/globe-clouds/, { use: "Cloud layer on the hero globe", ...NASA, source: "NASA Goddard – Blue Marble clouds (Reto Stöckli)", origin: "scripts/fetch-geodata.mjs", opt: "2048×1024 greyscale WebP" }],
  [/^geo\/globe-/, { use: "Hero globe colour map (4k desktop, 2k mobile)", ...NASA, origin: "scripts/fetch-geodata.mjs (BMNG July 2004, topo+bathy)", opt: "Equirectangular WebP q80" }],
  [/^geo\/region-norway/, { use: "Western Norway map in the hero approach (lon 0.5–10.5E, lat 57.4–63.4N)", ...NASA, origin: "scripts/fetch-geodata.mjs (BMNG 500 m tile C1 crop)", opt: "Plate carrée crop, WebP" }],
  [/^geo\/bergen-s2/, { use: "Bergen aerial imagery draped on terrain (36 km square / 6 km Laksevåg detail, EPSG:32632)", ...S2, origin: "scripts/fetch-geodata.mjs (TCI, cloud cover < 5 %, gentle tone curve)", opt: "WebP 2k desktop / 1k mobile" }],
  [/^geo\/bergen-dem/, { use: "Terrain elevation for the hero (same squares as the imagery)", ...DEM, origin: "scripts/fetch-geodata.mjs; detail .webp packs 16-bit as R/G (scripts/bake-hero-posters.mjs dem)", opt: "16-bit PNG + lossless WebP" }],
  [/^geo\/hero-poster/, { use: "Hero LCP poster = first frame of the globe intro", ...NASA, origin: "Rendered by scripts/bake-hero-posters.mjs posters from the live scene", opt: "WebP q80" }],
  [/^geo\/hero-aerial/, { use: "Settled Bergen aerial still (reduced motion / no-WebGL hero)", ...S2, license: `${S2.license}; ${DEM.license}`, origin: "Rendered by scripts/bake-hero-posters.mjs from Sentinel-2 on Copernicus DEM relief", opt: "WebP q80" }],
  [/^geo\/geo\.json$/, { use: "Georeferencing for the geo/ files (bboxes, projection, DEM encoding)", source: "Project metadata", license: "Project asset (Envir)", url: null, opt: "-" }],
  [/^geology\//, (rel) => { const k = rel.split("/")[1].split("-")[0]; return { use: `Geological cutaway: ${LAYER[k] ?? k} layer (hero)`, ...GEOLOGY[k], origin: "scripts/fetch-geology.mjs", opt: "Poly Haven 2k → 1024² (512² mobile) WebP; albedo sRGB, normal OpenGL, roughness greyscale" }; }],
  [/^envir-hd\//, { use: "Poster frame under Envir's background film (1920 px + 1024 px -m mobile)", ...ENVIR, source: "Vimeo thumbnail of Envir's film (Akasuki AS for Envir)", opt: "WebP q70–80 via sharp" }],
  [/^earth\/strata-/, { use: "Earth cross-section atlas (contact landscape)", origin: "Baked by scripts/bake-earth.mjs from Poly Haven CC0 scans: Forrest Ground 01, Brown Mud Rocks 01, Brown Mud Dry, Coast Sand 01, Sandy Gravel 02, Rock Face 03", ...{ source: "Custom bake of Poly Haven CC0 scans", license: "CC0 1.0 inputs; bake is a project asset", url: "https://polyhaven.com/license" }, opt: "768×1728 albedo q66, normal at half resolution q62" }],
  [/^earth\/terrain-/, { use: "Terrain surface micro-relief (contact landscape; normal map only)", ...PH("Aerial Grass Rock"), opt: "512² WebP (albedo q64, normal q58)" }],
  [/^facility\/concrete-/, { use: "Yard / industrial floor (facility model, scroll story)", ...PH("Concrete Floor 02"), opt: "512² WebP (albedo q64, normal q58)" }],
  [/^facility\/asphalt-/, { use: "Road surface (scroll story, stage 5)", ...PH("Asphalt 02"), opt: "512² WebP (albedo q64, normal q58)" }],
  [/^posters\//, { use: "Poster shown while the matching WebGL scene loads", ...OWN, origin: "scripts/render-assets.mjs posters", opt: "WebP q76; served through next/image" }],
  [/^materials\/sand-/, { use: "Sand mound surface (material library, /studio renders)", ...PH("Coast Sand 01"), opt: "512² WebP (albedo q64, normal q58)" }],
  [/^materials\/gravel-/, { use: "Gravel mound base (material library, /studio renders)", ...PH("Gravel Ground 01", "Rob Tuytel"), opt: "512² WebP (albedo q64, normal q58)" }],
  [/^materials\/stones\.glb$/, { use: "Instanced scanned stones (/studio product renders)", ...PH("Namaqualand Stones 01", "Greg Zaal, Jenelle van Heerden"), opt: "5 meshes, 116–484 tris each, meshopt, 256² WebP PBR" }],
  [/^materials\/rock-grey\.glb$/, { use: "Instanced grey rock (/studio product renders)", ...PH("Moon Rock 02"), opt: "494 tris, meshopt, 256² WebP PBR" }],
  [/^materials\/renders\//, { use: "Product render, transparent (fraction scale on /gjenvunne-masser)", ...OWN, origin: "scripts/render-assets.mjs materials (/studio, dev only)", opt: "800×600 WebP with alpha q82" }],
  [/^envir\/envir-logo/, { use: "Official logo", ...ENVIR, opt: "Original SVG" }],
  [/^envir\//, { use: "Official photography / product photos", ...ENVIR, opt: "Original; resized + AVIF/WebP by next/image" }],
  [/^team\//, { use: "Staff portraits (team, contacts)", ...ENVIR, source: "Envir AS – envir.com CMS", opt: "Original; resized by next/image" }],
  [/^news\//, { use: "Article images", ...ENVIR, source: "Envir AS – envir.com CMS", opt: "Original; resized by next/image" }],
];

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const files = walk(root).filter((f) => !f.endsWith("manifest.json") && !f.endsWith(".DS_Store")).sort();

const items = [];
for (const f of files) {
  const rel = relative(root, f);
  const hit = RULES.find(([re]) => re.test(rel))?.[1];
  const rule = (typeof hit === "function" ? hit(rel) : hit) ?? { use: "Unclassified", source: "Unknown", license: "Review", opt: "-" };
  const ext = rel.split(".").pop();
  let dims = null;
  if (["webp", "jpg", "jpeg", "png", "avif"].includes(ext)) {
    const m = await sharp(f).metadata();
    dims = `${m.width}×${m.height}`;
  }
  items.push({ path: `/assets/${rel}`, format: ext, kb: Math.round(statSync(f).size / 1024), dims, ...rule });
}

writeFileSync(join(root, "manifest.json"), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: items.length, items }, null, 2));

const groups = Object.groupBy(items, (i) => i.path.split("/")[2]);
let md = `# Asset manifest\n\nGenerated by \`node scripts/asset-manifest.mjs\` (${items.length} files, ${Math.round(items.reduce((s, i) => s + i.kb, 0) / 1024 * 10) / 10} MB on disk). Machine-readable copy: \`public/assets/manifest.json\`.\n\n`;
md += `Photos in \`envir/\`, \`envir-hd/\`, \`team/\` and \`news/\` are Envir's own and are resized/re-encoded on request by \`next/image\`; visitors never download the originals. Everything else is optimised at build time and shipped as-is.\n\n`;
md += `| Folder | Files | Size | Source | Licence |\n| --- | --- | --- | --- | --- |\n`;
for (const [g, list] of Object.entries(groups)) {
  const srcs = [...new Set(list.map((i) => i.source))];
  const lic = [...new Set(list.map((i) => i.license))];
  md += `| \`${g}/\` | ${list.length} | ${list.reduce((s, i) => s + i.kb, 0)} KB | ${srcs.join("; ")} | ${lic.join("; ")} |\n`;
}
for (const g of ["geo", "geology", "envir-hd", "earth", "facility", "materials", "posters"]) {
  if (!groups[g]) continue;
  md += `\n## ${g}/\n\n| File | Format | Size | Dimensions | Use | Source / licence | Optimisation |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const i of groups[g]) md += `| \`${i.path.replace("/assets/", "")}\` | ${i.format} | ${i.kb} KB | ${i.dims ?? "–"} | ${i.use} | ${i.origin ?? i.source} — ${i.license} | ${i.opt} |\n`;
}
md += `\n## Attribution shown on the site\n\n- Globe and Western Norway: NASA Earth Observatory, Blue Marble Next Generation (public domain).\n- Bergen imagery: *Contains modified Copernicus Sentinel data 2020*.\n- Elevation: *© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved*.\n- Geology scans: Poly Haven (CC0, credit not required but given).\n- Envir's background film (Vimeo 1205434986) is produced by Akasuki AS for Envir and embedded, not re-hosted; confirm the licence covers the new site.\n`;
md += `\n## Pipeline\n\n- **Geodata:** \`node scripts/fetch-geodata.mjs\` (NASA BMNG, Sentinel-2 L2A via Earth Search STAC, Copernicus DEM GLO-30; needs geotiff — see the script header). Georeferencing in \`public/assets/geo/geo.json\`.\n- **Hero posters and detail DEM:** \`node scripts/bake-hero-posters.mjs [posters|dem]\` against a running dev server.\n- **Geology scans:** \`node scripts/fetch-geology.mjs\` (Poly Haven API → 1024²/512² WebP).\n- **GLB stones:** \`gltf-transform optimize <in>.gltf <out>.glb --compress meshopt --texture-compress webp --texture-size 256 --simplify true --simplify-ratio 0.02 --simplify-error 0.03 --join false\`. Three.js decodes meshopt natively; there's no Draco decoder download.\n- **Earth atlas:** \`node scripts/bake-earth.mjs <dir-with-polyhaven-1k-jpgs>\`.\n- **Product renders and scene posters:** \`BASE=http://localhost:3000 node scripts/render-assets.mjs [materials|posters]\` against \`npm run dev\`.\n- **Icons:** process icons are inline SVG React components (\`src/components/diagrams.tsx\`) so they inherit colour and need no requests; \`public/assets/icons/\` is intentionally empty.\n`;
writeFileSync(new URL("../ASSETS.md", import.meta.url), md);
console.log(`manifest: ${items.length} files`);
console.log(Object.entries(groups).map(([g, l]) => `${g}: ${l.length} files, ${l.reduce((s, i) => s + i.kb, 0)} KB`).join("\n"));
const unknown = items.filter((i) => i.use === "Unclassified");
if (unknown.length) console.log("UNCLASSIFIED:", unknown.map((i) => i.path).join(", "));
