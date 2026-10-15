/**
 * Fetches and bakes the real Earth -> Norway -> Bergen geodata used by the
 * cinematic camera move.  Output: public/assets/geo/
 *
 *   globe-4k.webp / globe-2k.webp     NASA Blue Marble Next Generation, July 2004,
 *                                     topography + bathymetry (public domain)
 *   globe-clouds-2k.webp              NASA Blue Marble cloud composite (public domain)
 *   region-norway.webp / -1k.webp     BMNG 500 m tile C1 cropped to Western Norway
 *   bergen-s2-2k.webp / -1k.webp      Copernicus Sentinel-2 L2A true colour mosaic, 36 km square
 *   bergen-dem-512.png / -256.webp    Copernicus DEM GLO-30 resampled onto the same square
 *   bergen-s2-detail-2k.webp          6 km square around Laksevåg
 *   bergen-dem-detail-256.png
 *   geo.json                          georeferencing for every file (bboxes, UTM, encodings)
 *
 * Usage:
 *   GEO_DL_DIR=/path/to/empty/download/dir \
 *   GEOTIFF_DIR=/path/to/dir/containing/node_modules/geotiff \
 *   node scripts/fetch-geodata.mjs [globe] [clouds] [region] [s2] [dem]   (no args = all)
 *
 * geotiff (npm "geotiff", tested with 2.1.3) is NOT a project dependency; install it
 * anywhere (`npm i geotiff@2.1.3` in a scratch dir) and point GEOTIFF_DIR at that dir.
 * Downloads are cached in GEO_DL_DIR; nothing from there is ever executed.
 */
import { createRequire } from "node:module";
import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
sharp.cache(false);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.GEO_OUT ?? join(ROOT, "public/assets/geo");
const DL = process.env.GEO_DL_DIR;
if (!DL) throw new Error("set GEO_DL_DIR to a download/cache directory");
mkdirSync(OUT, { recursive: true });
mkdirSync(DL, { recursive: true });

const stages = new Set(process.argv.slice(2));
const run = (s) => stages.size === 0 || stages.has(s);

// ---------------------------------------------------------------- sources
const BMNG = "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73751"; // July 2004, topo+bathy
const BMNG_WORLD = `${BMNG}/world.topo.bathy.200407.3x21600x10800.jpg`; // 1 arcmin global
// 500 m tiles are 21600x21600 = 90x90 deg: A=180W-90W, B=90W-0, C=0-90E, D=90E-180E; 1=north, 2=south.
const BMNG_C1 = `${BMNG}/world.topo.bathy.200407.3x21600x21600.C1.jpg`;
const CLOUDS = "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_8192.tif";
const STAC = "https://earth-search.aws.element84.com/v1";
// One Sentinel-2 datatake (same orbit, same minute), 2020-08-09, four MGRS tiles in UTM 32N.
// Picked from a search with eo:cloud_cover < 5 on all tiles; verified cloud-free over the square.
const S2_ITEMS = ["S2B_32VKM_20200809_1_L2A", "S2B_32VKN_20200809_1_L2A", "S2B_32VLM_20200809_1_L2A", "S2B_32VLN_20200809_1_L2A"];
const DEM_BASE = "https://copernicus-dem-30m.s3.amazonaws.com";

// ---------------------------------------------------------------- geometry
const ZONE = 32; // EPSG:32632, WGS 84 / UTM zone 32N (Norway uses 32V for Bergen; S2 tiles are 32V*)
const SQUARE = { name: "bergen", centre: [5.3, 60.38], size: 36000 }; // metres
const DETAIL = { name: "bergen-detail", centre: [5.29, 60.385], size: 6000 }; // Laksevåg
const REGION = { lonMin: 0.5, lonMax: 10.5, latMin: 57.4, latMax: 63.4 }; // plate carrée crop of BMNG C1

// WGS84 transverse Mercator, Krüger series (Karney 2011) to 4th order in n: sub-mm in-zone.
const WA = 6378137, WF = 1 / 298.257223563, K0 = 0.9996;
const n = WF / (2 - WF), AA = (WA / (1 + n)) * (1 + (n * n) / 4 + n ** 4 / 64);
const ALPHA = [n / 2 - (2 * n * n) / 3 + (5 * n ** 3) / 16 + (41 * n ** 4) / 180, (13 * n * n) / 48 - (3 * n ** 3) / 5 + (557 * n ** 4) / 1440, (61 * n ** 3) / 240 - (103 * n ** 4) / 140, (49561 * n ** 4) / 161280];
const BETA = [n / 2 - (2 * n * n) / 3 + (37 * n ** 3) / 96 - n ** 4 / 360, (n * n) / 48 + n ** 3 / 15 - (437 * n ** 4) / 1440, (17 * n ** 3) / 480 - (37 * n ** 4) / 840, (4397 * n ** 4) / 161280];
const DELTA = [2 * n - (2 * n * n) / 3 - 2 * n ** 3 + (116 * n ** 4) / 45, (7 * n * n) / 3 - (8 * n ** 3) / 5 - (227 * n ** 4) / 45, (56 * n ** 3) / 15 - (136 * n ** 4) / 35, (4279 * n ** 4) / 630];
const ECC = Math.sqrt(WF * (2 - WF)), DEG = Math.PI / 180;

export function lonlatToUtm(lon, lat, zone = ZONE) {
  const lam = lon * DEG - (zone * 6 - 183) * DEG, phi = lat * DEG;
  const t = Math.sinh(Math.atanh(Math.sin(phi)) - ECC * Math.atanh(ECC * Math.sin(phi)));
  const xi0 = Math.atan2(t, Math.cos(lam)), eta0 = Math.atanh(Math.sin(lam) / Math.sqrt(1 + t * t));
  let xi = xi0, eta = eta0;
  for (let j = 1; j <= 4; j++) {
    xi += ALPHA[j - 1] * Math.sin(2 * j * xi0) * Math.cosh(2 * j * eta0);
    eta += ALPHA[j - 1] * Math.cos(2 * j * xi0) * Math.sinh(2 * j * eta0);
  }
  return [500000 + K0 * AA * eta, K0 * AA * xi];
}
export function utmToLonlat(E, N, zone = ZONE) {
  const xi = N / (K0 * AA), eta = (E - 500000) / (K0 * AA);
  let xi0 = xi, eta0 = eta;
  for (let j = 1; j <= 4; j++) {
    xi0 -= BETA[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
    eta0 -= BETA[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
  }
  const chi = Math.asin(Math.sin(xi0) / Math.cosh(eta0));
  let phi = chi;
  for (let j = 1; j <= 4; j++) phi += DELTA[j - 1] * Math.sin(2 * j * chi);
  return [zone * 6 - 183 + Math.atan2(Math.sinh(eta0), Math.cos(xi0)) / DEG, phi / DEG];
}

/** Axis-aligned UTM square snapped to the 10 m Sentinel-2 grid. */
function utmSquare({ centre, size }) {
  const [e, nn] = lonlatToUtm(...centre);
  const minE = Math.round((e - size / 2) / 10) * 10, minN = Math.round((nn - size / 2) / 10) * 10;
  return { minE, minN, maxE: minE + size, maxN: minN + size, size };
}
const r6 = (v) => Math.round(v * 1e6) / 1e6;
function squareMeta(sq, centre) {
  const corners = { nw: [sq.minE, sq.maxN], ne: [sq.maxE, sq.maxN], se: [sq.maxE, sq.minN], sw: [sq.minE, sq.minN] };
  const ll = Object.fromEntries(Object.entries(corners).map(([k, [e, nn]]) => [k, utmToLonlat(e, nn).map(r6)]));
  const lons = Object.values(ll).map((p) => p[0]), lats = Object.values(ll).map((p) => p[1]);
  // grid convergence: angle from image "up" (grid north) to true north, clockwise positive
  const [ce, cn] = lonlatToUtm(...centre), [ne, nn] = lonlatToUtm(centre[0], centre[1] + 0.01);
  const trueNorthBearing = Math.atan2(ne - ce, nn - cn) / DEG;
  return {
    crs: "EPSG:32632 (WGS 84 / UTM zone 32N)",
    utmBbox: { minE: sq.minE, minN: sq.minN, maxE: sq.maxE, maxN: sq.maxN },
    sizeMetres: sq.size,
    requestedCentreLonLat: centre,
    centreLonLat: utmToLonlat((sq.minE + sq.maxE) / 2, (sq.minN + sq.maxN) / 2).map(r6),
    cornersLonLat: ll,
    lonLatEnvelope: { lonMin: Math.min(...lons), lonMax: Math.max(...lons), latMin: Math.min(...lats), latMax: Math.max(...lats) },
    trueNorthDegFromImageUp: Math.round(trueNorthBearing * 1000) / 1000,
  };
}

// ---------------------------------------------------------------- io helpers
async function download(url, name) {
  const file = join(DL, name);
  for (let attempt = 0; attempt < 8; attempt++) {
    const have = existsSync(file) ? statSync(file).size : 0;
    const head = await fetch(url, { method: "HEAD" });
    if (!head.ok) throw new Error(`${url}: HTTP ${head.status}`);
    const total = Number(head.headers.get("content-length"));
    if (have === total) return file;
    console.log(`  downloading ${name} (${(total / 1e6).toFixed(1)} MB, have ${(have / 1e6).toFixed(1)})`);
    try {
      const res = await fetch(url, { headers: have ? { Range: `bytes=${have}-` } : {} });
      if (!(res.ok || res.status === 206)) throw new Error(`HTTP ${res.status}`);
      const ws = createWriteStream(file, { flags: have && res.status === 206 ? "a" : "w" });
      for await (const chunk of res.body) if (!ws.write(chunk)) await new Promise((r) => ws.once("drain", r));
      await new Promise((r, j) => ws.end((e) => (e ? j(e) : r())));
    } catch (e) {
      console.log(`  retry after: ${e.message}`);
    }
  }
  throw new Error(`could not download ${url}`);
}
async function loadGeotiff() {
  const dir = process.env.GEOTIFF_DIR;
  if (!dir) throw new Error("set GEOTIFF_DIR to a directory where `npm i geotiff` was run");
  const entry = createRequire(join(resolve(dir), "noop.js")).resolve("geotiff");
  return import(pathToFileURL(entry).href);
}
const kb = (f) => (statSync(f).size / 1024).toFixed(0) + " KB";
const geoJsonPath = join(OUT, "geo.json");
const meta = existsSync(geoJsonPath) ? JSON.parse(readFileSync(geoJsonPath, "utf8")) : {};
const saveMeta = () => writeFileSync(geoJsonPath, JSON.stringify(meta, null, 2) + "\n");

// ---------------------------------------------------------------- 1. globe
if (run("globe")) {
  console.log("globe");
  const src = await download(BMNG_WORLD, "world.topo.bathy.200407.3x21600x10800.jpg");
  for (const [w, q] of [[4096, 80], [2048, 80]]) {
    const out = join(OUT, `globe-${w / 1024}k.webp`);
    await sharp(src, { limitInputPixels: false }).resize(w, w / 2, { kernel: "lanczos3" }).webp({ quality: q, effort: 6 }).toFile(out);
    console.log(`  ${out} ${kb(out)}`);
  }
  meta.globe = {
    files: ["globe-4k.webp", "globe-2k.webp"],
    source: "NASA Blue Marble: Next Generation w/ Topography and Bathymetry, July 2004 (" + BMNG_WORLD + ")",
    projection: "equirectangular (plate carrée), lon -180..180 left->right, lat 90..-90 top->bottom",
    note: "three.js SphereGeometry default UVs already match (u=(lon+180)/360, v=(lat+90)/180); with no rotation lon/lat sits at x=cos(lat)cos(lon), y=sin(lat), z=-cos(lat)sin(lon) (lon 0 -> +X, 90E -> -Z)",
    licence: "Public domain (NASA)",
    attribution: "NASA Earth Observatory / Reto Stöckli, Blue Marble Next Generation",
  };
  saveMeta();
}

// ---------------------------------------------------------------- 2. clouds
if (run("clouds")) {
  console.log("clouds");
  const src = await download(CLOUDS, "cloud_combined_8192.tif");
  const out = join(OUT, "globe-clouds-2k.webp");
  await sharp(src, { limitInputPixels: false }).greyscale().resize(2048, 1024, { kernel: "lanczos3" }).webp({ quality: 78, effort: 6 }).toFile(out);
  console.log(`  ${out} ${kb(out)}`);
  meta.clouds = {
    files: ["globe-clouds-2k.webp"],
    source: "NASA Blue Marble cloud composite (cloud_combined_8192.tif, " + CLOUDS + ")",
    projection: "equirectangular, same layout as globe-*.webp",
    encoding: "greyscale (R=G=B); use the red channel as cloud opacity (black = clear)",
    licence: "Public domain (NASA)",
    attribution: "NASA Goddard Space Flight Center / Reto Stöckli, Blue Marble cloud composite",
  };
  saveMeta();
}

// ---------------------------------------------------------------- 3. region
if (run("region")) {
  console.log("region");
  const src = await download(BMNG_C1, "world.topo.bathy.200407.3x21600x21600.C1.jpg");
  const PPD = 240; // 21600 px / 90 deg
  const left = Math.round(REGION.lonMin * PPD), top = Math.round((90 - REGION.latMax) * PPD);
  const width = Math.round((REGION.lonMax - REGION.lonMin) * PPD), height = Math.round((REGION.latMax - REGION.latMin) * PPD);
  const crop = await sharp(src, { limitInputPixels: false }).extract({ left, top, width, height }).toBuffer();
  const files = [];
  for (const [w, name] of [[2048, "region-norway.webp"], [1024, "region-norway-1k.webp"]]) {
    const h = Math.round((height * w) / width);
    const out = join(OUT, name);
    await sharp(crop).resize(w, h, { kernel: "lanczos3", fit: "fill" }).webp({ quality: 82, effort: 6 }).toFile(out);
    files.push({ file: name, width: w, height: h });
    console.log(`  ${out} ${w}x${h} ${kb(out)}`);
  }
  meta.region = {
    files,
    source: "NASA BMNG July 2004 topo+bathy 500 m tile C1 (0-90E, 0-90N): " + BMNG_C1,
    projection: "equirectangular (plate carrée) lon/lat, WGS84",
    bboxLonLat: REGION,
    sourcePixels: { left, top, width, height, pixelDeg: 1 / PPD },
    degPerPixel2048: { lon: (REGION.lonMax - REGION.lonMin) / 2048, lat: (REGION.latMax - REGION.latMin) / files[0].height },
    note: "plate carrée: on a flat plane E-W is stretched by 1/cos(lat); for a true-proportion plane scale width by cos(60.4°)≈0.494, or drape onto the globe with u=(lon-lonMin)/(lonMax-lonMin), v=(lat-latMin)/(latMax-latMin)",
    licence: "Public domain (NASA)",
    attribution: "NASA Earth Observatory / Reto Stöckli, Blue Marble Next Generation",
  };
  saveMeta();
}

// ---------------------------------------------------------------- 4/6. Sentinel-2
/** Gentle natural grade for Sentinel-2 TCI: per-channel dark-object (haze) subtraction,
 *  a shared white point, mild gamma lift and a soft shoulder (saturation is reduced after). */
function gradeTci(rgb, stats) {
  const out = Buffer.alloc(rgb.length);
  const lut = [0, 1, 2].map((c) => {
    const l = new Uint8Array(256);
    for (let v = 0; v < 256; v++) {
      let x = Math.max(0, v - stats.black[c]) / (stats.white - stats.black[c]);
      x = Math.pow(Math.max(0, x), 0.82); // lift mid-tones
      x = x < 0.8 ? x : 0.8 + 0.2 * Math.tanh((x - 0.8) / 0.2); // soft shoulder, no hard clip
      l[v] = Math.round(Math.min(1, x) * 255);
    }
    return l;
  });
  for (let i = 0; i < rgb.length; i += 3) for (let c = 0; c < 3; c++) out[i + c] = lut[c][rgb[i + c]];
  return out;
}
function tciStats(rgb) {
  const hist = [0, 1, 2].map(() => new Float64Array(256));
  const lum = new Float64Array(256);
  let count = 0;
  for (let i = 0; i < rgb.length; i += 3) {
    if (!rgb[i] && !rgb[i + 1] && !rgb[i + 2]) continue;
    for (let c = 0; c < 3; c++) hist[c][rgb[i + c]]++;
    lum[Math.max(rgb[i], rgb[i + 1], rgb[i + 2])]++;
    count++;
  }
  const pct = (h, p) => { let s = 0; for (let v = 0; v < 256; v++) if ((s += h[v]) >= p * count) return v; return 255; };
  // haze offset: a little below the darkest 0.2% (clear deep water); white: 99.8% of max channel
  return { black: hist.map((h) => Math.max(0, pct(h, 0.002) - 2)), white: Math.max(120, pct(lum, 0.998)) };
}

async function readS2Mosaic(sq) {
  const cache = join(DL, `s2-${sq.minE}-${sq.minN}-${sq.size}.png`);
  const w = sq.size / 10;
  if (existsSync(cache)) return { rgb: await sharp(cache).removeAlpha().raw().toBuffer(), w };
  const { fromUrl } = await loadGeotiff();
  const rgb = Buffer.alloc(w * w * 3);
  for (const id of S2_ITEMS) {
    const item = await (await fetch(`${STAC}/collections/sentinel-2-l2a/items/${id}`)).json();
    const asset = item.assets.visual;
    const [res, , x0, , , y0] = asset["proj:transform"];
    const [rows, cols] = asset["proj:shape"];
    const cx0 = Math.max(sq.minE, x0), cx1 = Math.min(sq.maxE, x0 + cols * res);
    const cy1 = Math.min(sq.maxN, y0), cy0 = Math.max(sq.minN, y0 - rows * res);
    if (cx1 <= cx0 || cy1 <= cy0) continue;
    const win = [(cx0 - x0) / res, (y0 - cy1) / res, (cx1 - x0) / res, (y0 - cy0) / res];
    console.log(`  ${id} window ${win.join(",")}`);
    const tiff = await fromUrl(asset.href);
    const img = await tiff.getImage();
    const data = await img.readRasters({ window: win, interleave: true });
    const ww = win[2] - win[0], wh = win[3] - win[1];
    const ox = (cx0 - sq.minE) / 10, oy = (sq.maxN - cy1) / 10;
    for (let y = 0; y < wh; y++)
      for (let x = 0; x < ww; x++) {
        const s = (y * ww + x) * 3, d = ((oy + y) * w + ox + x) * 3;
        if (data[s] || data[s + 1] || data[s + 2]) { rgb[d] = data[s]; rgb[d + 1] = data[s + 1]; rgb[d + 2] = data[s + 2]; }
      }
  }
  await sharp(rgb, { raw: { width: w, height: w, channels: 3 } }).png().toFile(cache);
  return { rgb, w };
}

const SAT = 0.86; // TCI greens read minty/teal; pull them back towards what the eye sees
const s2sq = utmSquare(SQUARE), detailSq = utmSquare(DETAIL);
if (run("s2")) {
  console.log("s2");
  const big = await readS2Mosaic(s2sq);
  const stats = tciStats(big.rgb); // one grade for both so they match during the descent
  console.log("  grade", JSON.stringify(stats));
  const graded = gradeTci(big.rgb, stats);
  const raw = { raw: { width: big.w, height: big.w, channels: 3 } };
  for (const [px, q] of [[2048, 76], [1024, 80]]) {
    const out = join(OUT, `bergen-s2-${px / 1024}k.webp`);
    await sharp(graded, raw).resize(px, px, { kernel: "lanczos3" }).modulate({ saturation: SAT }).webp({ quality: q, effort: 6 }).toFile(out);
    console.log(`  ${out} ${kb(out)}`);
  }
  const det = await readS2Mosaic(detailSq);
  const out = join(OUT, "bergen-s2-detail-2k.webp");
  await sharp(gradeTci(det.rgb, stats), { raw: { width: det.w, height: det.w, channels: 3 } })
    .resize(2048, 2048, { kernel: "lanczos3" })
    .modulate({ saturation: SAT })
    .sharpen({ sigma: 1.2, m1: 0.3, m2: 0.6 })
    .webp({ quality: 76, effort: 6 })
    .toFile(out);
  console.log(`  ${out} ${kb(out)}`);
  meta.s2 = {
    source: `Copernicus Sentinel-2B L2A, 2020-08-09 11:14 UTC (processing baseline 05.00), TCI (visual) 10 m COGs via ${STAC}: ${S2_ITEMS.join(", ")}`,
    grade: { ...stats, gamma: 0.82, note: "per-channel black offset (haze), shared white, gamma lift, soft shoulder; saturation x0.86 (desaturated slightly)" },
    licence: "Copernicus Sentinel data licence: free, full and open incl. commercial use; attribution required",
    attribution: "Contains modified Copernicus Sentinel data 2020",
    square: { files: [{ file: "bergen-s2-2k.webp", px: 2048, metresPerPixel: s2sq.size / 2048 }, { file: "bergen-s2-1k.webp", px: 1024, metresPerPixel: s2sq.size / 1024 }], ...squareMeta(s2sq, SQUARE.centre) },
    detail: { files: [{ file: "bergen-s2-detail-2k.webp", px: 2048, metresPerPixel: detailSq.size / 2048, nativeResolution: "10 m (upsampled)" }], ...squareMeta(detailSq, DETAIL.centre) },
  };
  saveMeta();
}

// ---------------------------------------------------------------- 5/6. DEM
async function demSampler(sq) {
  const { fromFile } = await loadGeotiff();
  const env = squareMeta(sq, [5.3, 60.4]).lonLatEnvelope;
  const tiles = [];
  for (let lat = Math.floor(env.latMin); lat <= Math.floor(env.latMax); lat++)
    for (let lon = Math.floor(env.lonMin); lon <= Math.floor(env.lonMax); lon++) {
      const name = `Copernicus_DSM_COG_10_N${String(lat).padStart(2, "0")}_00_E${String(lon).padStart(3, "0")}_00_DEM`;
      const file = await download(`${DEM_BASE}/${name}/${name}.tif`, `${name}.tif`);
      const img = await (await fromFile(file)).getImage();
      const [ox, oy] = img.getOrigin(), [rx, ry] = img.getResolution();
      const pixelIsPoint = img.getGeoKeys().GTRasterTypeGeoKey === 2;
      const [data] = await img.readRasters();
      tiles.push({ name, ox: pixelIsPoint ? ox - rx / 2 : ox, oy: pixelIsPoint ? oy - ry / 2 : oy, rx, ry, w: img.getWidth(), h: img.getHeight(), data, lon, lat });
    }
  return (lon, lat) => {
    const t = tiles.find((t) => lon >= t.lon && lon < t.lon + 1 && lat >= t.lat && lat < t.lat + 1);
    if (!t) return NaN;
    const fx = Math.min(t.w - 1, Math.max(0, (lon - t.ox) / t.rx - 0.5)), fy = Math.min(t.h - 1, Math.max(0, (lat - t.oy) / t.ry - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(t.w - 1, x0 + 1), y1 = Math.min(t.h - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
    const g = (x, y) => t.data[y * t.w + x];
    return (g(x0, y0) * (1 - ax) + g(x1, y0) * ax) * (1 - ay) + (g(x0, y1) * (1 - ax) + g(x1, y1) * ax) * ay;
  };
}
async function bakeDem(sq, px, sample) {
  const h = new Float32Array(px * px);
  let min = Infinity, max = -Infinity, neg = 0;
  for (let j = 0; j < px; j++)
    for (let i = 0; i < px; i++) {
      const E = sq.minE + ((i + 0.5) * sq.size) / px, N = sq.maxN - ((j + 0.5) * sq.size) / px;
      let v = sample(...utmToLonlat(E, N));
      if (v < 0) { neg++; v = 0; }
      h[j * px + i] = v;
      min = Math.min(min, v); max = Math.max(max, v);
    }
  return { h, min, max, neg };
}
// Minimal 16-bit greyscale PNG writer (sharp rescales raw ushort input as if it were 8-bit).
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "latin1");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function writeGrey16Png(file, h, size, max) {
  const rows = Buffer.alloc(size * (1 + size * 2)); // filter byte 0 per row, big-endian samples
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) rows.writeUInt16BE(Math.round((h[y * size + x] / max) * 65535), y * (1 + size * 2) + 1 + x * 2);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 16; ihdr[9] = 0; // 16-bit greyscale
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(rows, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
}
if (run("dem")) {
  console.log("dem");
  const sample = await demSampler(s2sq);
  const big = await bakeDem(s2sq, 512, sample);
  const maxBig = Math.ceil(big.max);
  writeGrey16Png(join(OUT, "bergen-dem-512.png"), big.h, 512, maxBig);
  const b8 = Buffer.alloc(big.h.length);
  for (let i = 0; i < big.h.length; i++) b8[i] = Math.round((big.h[i] / maxBig) * 255);
  await sharp(b8, { raw: { width: 512, height: 512, channels: 1 } }).resize(256, 256, { kernel: "lanczos3" }).webp({ lossless: true }).toFile(join(OUT, "bergen-dem-256.webp"));
  const det = await bakeDem(detailSq, 256, await demSampler(detailSq));
  const maxDet = Math.ceil(det.max);
  writeGrey16Png(join(OUT, "bergen-dem-detail-256.png"), det.h, 256, maxDet);
  for (const f of ["bergen-dem-512.png", "bergen-dem-256.webp", "bergen-dem-detail-256.png"]) console.log(`  ${f} ${kb(join(OUT, f))}`);
  console.log(`  square min ${big.min.toFixed(1)} max ${big.max.toFixed(1)} (neg clamped ${big.neg}); detail min ${det.min.toFixed(1)} max ${det.max.toFixed(1)}`);
  meta.dem = {
    source: "Copernicus DEM GLO-30 (2021 release), tiles N60 E004/E005 from " + DEM_BASE,
    verticalDatum: "EGM2008 geoid heights in metres; sea surface ≈ 0",
    licence: "Copernicus DEM licence (free incl. commercial use, attribution required)",
    attribution: "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved",
    resampling: "bilinear, sampled at each output pixel centre: UTM32N (E,N) -> lon/lat -> DEM; negatives clamped to 0",
    square: {
      files: [
        { file: "bergen-dem-512.png", px: 512, metresPerPixel: s2sq.size / 512, encoding: `16-bit grey PNG, metres = value / 65535 * ${maxBig}` },
        { file: "bergen-dem-256.webp", px: 256, metresPerPixel: s2sq.size / 256, encoding: `8-bit lossless WebP (R=G=B), metres = value / 255 * ${maxBig}` },
      ],
      minMetres: Math.round(big.min * 10) / 10, maxMetres: Math.round(big.max * 10) / 10, decodeMaxMetres: maxBig,
      ...squareMeta(s2sq, SQUARE.centre),
    },
    detail: {
      files: [{ file: "bergen-dem-detail-256.png", px: 256, metresPerPixel: detailSq.size / 256, encoding: `16-bit grey PNG, metres = value / 65535 * ${maxDet}` }],
      minMetres: Math.round(det.min * 10) / 10, maxMetres: Math.round(det.max * 10) / 10, decodeMaxMetres: maxDet,
      ...squareMeta(detailSq, DETAIL.centre),
    },
  };
  saveMeta();
}
console.log("done");
