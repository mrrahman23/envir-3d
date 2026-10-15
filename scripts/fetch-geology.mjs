/**
 * Fetches CC0 Poly Haven PBR scans for the scroll-driven geological
 * cross-section and writes web-ready WebP maps to public/assets/geology/.
 *
 *   node scripts/fetch-geology.mjs <empty-download-dir> [gltf-transform-cli]
 *
 * <empty-download-dir>  where the raw 2k JPGs (and the roots glTF) are saved.
 *                       Treated as untrusted data: nothing in it is executed.
 * [gltf-transform-cli]  optional path to the @gltf-transform/cli binary
 *                       (e.g. <scratch>/node_modules/.bin/gltf-transform).
 *                       When given, the Root Cluster 01 model is downloaded
 *                       and optimised to geology/roots.glb.
 *
 * Outputs per layer: <layer>-albedo-1k.webp, <layer>-albedo-512.webp,
 * <layer>-normal-1k.webp (OpenGL), <layer>-rough-512.webp (greyscale);
 * turf: turf-albedo-1k.webp, turf-normal-1k.webp. Colours are not graded.
 * Prints the mean albedo colour (sRGB hex) of each layer.
 *
 * All sources: Poly Haven, CC0 1.0 (https://polyhaven.com/license).
 */
import { mkdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const dl = process.argv[2];
const gltfCli = process.argv[3];
if (!dl) throw new Error("usage: node scripts/fetch-geology.mjs <download-dir> [gltf-transform-cli]");
const out = fileURLToPath(new URL("../public/assets/geology/", import.meta.url));
mkdirSync(dl, { recursive: true });
mkdirSync(out, { recursive: true });

// layer -> Poly Haven asset id (chosen by eye from flat previews; see notes)
const LAYERS = {
  topsoil: "mud_forest", //       dark humus with leaf litter / organic debris
  sand: "dense_sand", //          fine, compact natural sand
  gravel: "ganges_river_pebbles", // rounded, mixed-lithology river gravel
  mineral: "gray_rocks", //       angular crushed grey stone (pukk-like)
  bedrock: "quarry_wall", //      foliated, banded rock face (gneiss look)
  turf: "grass_ground", //        short natural grass / turf with soil showing
};

const UA = { headers: { "User-Agent": "envir-geology-fetch" } };
const getJSON = async (u) => (await fetch(u, UA)).json();
async function download(url, file) {
  if (existsSync(file) && statSync(file).size > 0) return file;
  const r = await fetch(url, UA);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return file;
}
const pick = (files, map) => {
  const m = files[map];
  const res = m["2k"] ? "2k" : "1k";
  return m[res].jpg.url;
};

const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const report = {};

for (const [layer, id] of Object.entries(LAYERS)) {
  const files = await getJSON(`https://api.polyhaven.com/files/${id}`);
  const dir = join(dl, id);
  mkdirSync(dir, { recursive: true });
  const diff = await download(pick(files, "Diffuse"), join(dir, "diff.jpg"));
  const nor = await download(pick(files, "nor_gl"), join(dir, "nor_gl.jpg"));
  const rough = layer === "turf" ? null : await download(pick(files, "Rough"), join(dir, "rough.jpg"));

  const w = (name) => join(out, `${layer}-${name}.webp`);
  await sharp(diff).resize(1024, 1024, { kernel: "lanczos3" }).webp({ quality: 78, effort: 6 }).toFile(w("albedo-1k"));
  await sharp(nor).resize(1024, 1024, { kernel: "lanczos3" }).webp({ quality: 80, effort: 6 }).toFile(w("normal-1k"));
  if (layer !== "turf") {
    await sharp(diff).resize(512, 512, { kernel: "lanczos3" }).webp({ quality: 76, effort: 6 }).toFile(w("albedo-512"));
    await sharp(rough).resize(512, 512, { kernel: "lanczos3" }).greyscale().webp({ quality: 80, effort: 6 }).toFile(w("rough-512"));
  }
  const { channels } = await sharp(diff).resize(256, 256).stats();
  report[layer] = { id, url: `https://polyhaven.com/a/${id}`, meanAlbedo: hex(channels.slice(0, 3).map((c) => c.mean)) };
  console.log(layer.padEnd(8), id.padEnd(22), report[layer].meanAlbedo);
}

// Optional: CC0 photogrammetry root cluster -> optimised GLB.
if (gltfCli) {
  const id = "root_cluster_01";
  const g = (await getJSON(`https://api.polyhaven.com/files/${id}`)).gltf["1k"].gltf;
  const dir = join(dl, id);
  mkdirSync(join(dir, "textures"), { recursive: true });
  const gltfFile = await download(g.url, join(dir, `${id}_1k.gltf`));
  for (const [rel, f] of Object.entries(g.include)) {
    // API-supplied relative paths are untrusted: refuse anything escaping dir.
    const dest = resolve(dir, rel);
    if (!dest.startsWith(resolve(dir) + sep)) throw new Error(`unsafe include path: ${rel}`);
    await download(f.url, dest);
  }
  const tmp = join(dl, `${id}-tmp.glb`);
  const run = (...a) => execFileSync(gltfCli, a, { stdio: "inherit" });
  // ~225k tris -> ~12k tris, weld, then meshopt + WebP textures <= 512.
  run("weld", gltfFile, tmp);
  run("simplify", tmp, tmp, "--ratio", "0.05", "--error", "0.002");
  run("resize", tmp, tmp, "--width", "512", "--height", "512");
  run("webp", tmp, tmp, "--quality", "78");
  run("meshopt", tmp, join(out, "roots.glb"), "--level", "medium");
  report.roots = { id, url: `https://polyhaven.com/a/${id}` };
}

writeFileSync(join(dl, "geology-report.json"), JSON.stringify(report, null, 2));
