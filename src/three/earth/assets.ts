/**
 * Asset loading for the Earth story: tiered texture URLs, a promise cache, DEM decoding
 * and the one-off CPU terrain build (displacement, normals, baked sun shadow + sky occlusion).
 */
import * as THREE from "three";
import type { Quality } from "@/lib/quality";
import { curvatureDrop, squarePoint, type Square } from "./geo";
import { GEOLOGY_URL, type LayerId } from "./layers";

const GEO = "/assets/geo";

export type Tier = "high" | "medium" | "low";
export const tierOf = (q: Quality): Tier => (q === "high" ? "high" : q === "medium" ? "medium" : "low");

export function urls(tier: Tier) {
  const hi = tier === "high";
  return {
    globe: `${GEO}/${hi ? "globe-4k" : "globe-2k"}.webp`,
    clouds: tier === "low" ? null : `${GEO}/globe-clouds-2k.webp`,
    region: `${GEO}/${hi ? "region-norway" : "region-norway-1k"}.webp`,
    bergen: `${GEO}/${hi ? "bergen-s2-2k" : "bergen-s2-1k"}.webp`,
    bergenDem: `${GEO}/bergen-dem-256.webp`,
    detail: `${GEO}/${hi ? "bergen-s2-detail-2k" : "bergen-s2-detail-1k"}.webp`,
    detailDem: `${GEO}/bergen-dem-detail-256.webp`,
    geology: (id: LayerId | "turf") => ({
      map: `${GEOLOGY_URL}/${id}-albedo-${hi || id === "turf" ? "1k" : "512"}.webp`,
      // Low tier (phones): no normal maps at all — the 1k normals are the heaviest files (≈1.6 MB).
      normal: tier === "low" ? null : `${GEOLOGY_URL}/${id}-normal-1k.webp`,
      rough: id === "turf" ? null : `${GEOLOGY_URL}/${id}-rough-512.webp`,
    }),
  };
}

// ---------------------------------------------------------------------------
// Textures

const texCache = new Map<string, Promise<THREE.Texture>>();

/**
 * Decode off the main thread: an <img> texture is decoded synchronously inside texImage2D on
 * first use (≈300 ms main-thread stalls for the 4k globe and the geology set). ImageBitmap is
 * decoded in the background, flipped at decode time. Safari < 17 / Firefox < 98 ignore the
 * decode options, so they keep the classic loader (same rule as three's GLTFLoader).
 */
function bitmapsSupported() {
  if (typeof createImageBitmap === "undefined") return false;
  const ua = navigator.userAgent;
  const safari = /^((?!chrome|android).)*safari/i.test(ua) ? Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0) : Infinity;
  const firefox = ua.includes("Firefox") ? Number(ua.match(/Firefox\/(\d+)/)?.[1] ?? 0) : Infinity;
  return safari >= 17 && firefox >= 98;
}

type Loaders =
  | { bitmaps: true; colour: THREE.ImageBitmapLoader; data: THREE.ImageBitmapLoader }
  | { bitmaps: false; colour: THREE.TextureLoader; data: THREE.TextureLoader };
let loaders: Loaders | null = null;
function getLoaders() {
  if (loaders) return loaders;
  if (bitmapsSupported()) {
    const colour = new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY", premultiplyAlpha: "none" });
    // Normal/roughness data must not be colour-managed by the decoder.
    const data = new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY", premultiplyAlpha: "none", colorSpaceConversion: "none" });
    loaders = { colour, data, bitmaps: true };
  } else {
    const l = new THREE.TextureLoader();
    loaders = { colour: l, data: l, bitmaps: false };
  }
  return loaders;
}

export function loadTexture(url: string, { srgb = true, repeat = false, anisotropy = 4 } = {}): Promise<THREE.Texture> {
  const key = `${url}|${srgb}|${repeat}`;
  let p = texCache.get(key);
  if (!p) {
    const l = getLoaders();
    p = new Promise<THREE.Texture>((resolve, reject) => {
      const done = (tex: THREE.Texture) => {
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.anisotropy = anisotropy;
        if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        else tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        resolve(tex);
      };
      const fail = (e: unknown) => {
        texCache.delete(key);
        reject(e);
      };
      if (l.bitmaps) {
        (srgb ? l.colour : l.data).load(
          url,
          (bmp: ImageBitmap) => {
            const tex = new THREE.Texture(bmp);
            tex.flipY = false; // already flipped by the decoder
            tex.needsUpdate = true;
            done(tex);
          },
          undefined,
          fail,
        );
      } else l.colour.load(url, done, undefined, fail);
    });
    texCache.set(key, p);
  }
  return p;
}

let users = 0;
/** Call on scene mount; the returned cleanup frees GPU + decoded memory once no scene uses the cache. */
export function retainTextures() {
  users++;
  return () => {
    users--;
    // Deferred so a StrictMode/remount cycle (cleanup → setup) keeps the cache.
    window.setTimeout(() => {
      if (users > 0) return;
      const all = [...texCache.values()];
      texCache.clear();
      heightCache.clear();
      for (const p of all)
        p.then((t) => {
          t.dispose();
          if (typeof ImageBitmap !== "undefined" && t.image instanceof ImageBitmap) t.image.close();
        }).catch(() => undefined);
    }, 0);
  };
}

// ---------------------------------------------------------------------------
// DEM decoding

type Heights = { heights: Float32Array; n: number };
const heightCache = new Map<string, Promise<Heights>>();

/** Decodes a lossless WebP DEM into metres (row 0 = north), once per URL. `packed`: R = high byte, G = low byte. */
export function loadHeights(url: string, maxMetres: number, packed: boolean): Promise<Heights> {
  const key = `${url}|${maxMetres}|${packed}`;
  let p = heightCache.get(key);
  if (!p) {
    p = decodeHeights(url, maxMetres, packed);
    p.catch(() => heightCache.delete(key));
    heightCache.set(key, p);
  }
  return p;
}

async function decodeHeights(url: string, maxMetres: number, packed: boolean): Promise<Heights> {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const n = bmp.width;
  const canvas = document.createElement("canvas");
  canvas.width = n;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const px = ctx.getImageData(0, 0, n, n).data;
  const out = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) {
    out[i] = packed ? ((px[i * 4] * 256 + px[i * 4 + 1]) / 65535) * maxMetres : (px[i * 4] / 255) * maxMetres;
  }
  return { heights: out, n };
}

function sample(h: Float32Array, n: number, x: number, y: number) {
  // x, y in pixel units (pixel centres at i + 0.5)
  const fx = Math.min(n - 1, Math.max(0, x - 0.5));
  const fy = Math.min(n - 1, Math.max(0, y - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(n - 1, x0 + 1);
  const y1 = Math.min(n - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = h[y0 * n + x0] + (h[y0 * n + x1] - h[y0 * n + x0]) * tx;
  const b = h[y1 * n + x0] + (h[y1 * n + x1] - h[y1 * n + x0]) * tx;
  return a + (b - a) * ty;
}

const yieldFrame = () => new Promise<void>((r) => setTimeout(r, 0));

export type TerrainOptions = {
  segments: number;
  exaggeration: number;
  /** Fraction of the square at each edge where relief tapers to sea level (blend into the region map). */
  taper: number;
  sun: THREE.Vector3;
};

/**
 * Builds the displaced terrain geometry on the CPU once.
 * Attributes: position (km, local frame), normal, uv, aShade (x: sun visibility, y: sky occlusion), aH (metres).
 */
export async function buildTerrain(sq: Square, dem: { heights: Float32Array; n: number }, o: TerrainOptions) {
  const seg = o.segments;
  const V = seg + 1;
  const hKm = new Float32Array(V * V);
  const pos = new Float32Array(V * V * 3);
  const uv = new Float32Array(V * V * 2);
  const aH = new Float32Array(V * V);
  const p = new THREE.Vector3();
  const { heights, n } = dem;
  for (let j = 0; j < V; j++) {
    const v = j / seg;
    for (let i = 0; i < V; i++) {
      const u = i / seg;
      const k = j * V + i;
      let m = sample(heights, n, u * n, (1 - v) * n);
      const edge = Math.min(u, 1 - u, v, 1 - v);
      if (o.taper > 0) m *= THREE.MathUtils.smoothstep(edge, 0, o.taper);
      aH[k] = m;
      const km = (m / 1000) * o.exaggeration;
      hKm[k] = km;
      squarePoint(sq, u, v, p);
      pos[k * 3] = p.x;
      pos[k * 3 + 1] = curvatureDrop(p.x, p.z) + km + 0.002;
      pos[k * 3 + 2] = p.z;
      uv[k * 2] = u;
      uv[k * 2 + 1] = v;
    }
  }

  // Normals from central differences of the final surface.
  const nor = new Float32Array(V * V * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const at = (i: number, j: number, out: THREE.Vector3) => {
    const k = (Math.min(seg, Math.max(0, j)) * V + Math.min(seg, Math.max(0, i))) * 3;
    return out.set(pos[k], pos[k + 1], pos[k + 2]);
  };
  const c = new THREE.Vector3();
  const d = new THREE.Vector3();
  for (let j = 0; j < V; j++) {
    for (let i = 0; i < V; i++) {
      at(i + 1, j, a).sub(at(i - 1, j, c));
      at(i, j + 1, b).sub(at(i, j - 1, d));
      // a runs along +u (east-ish), b along +v (north-ish, −Z): a × b points up.
      p.crossVectors(a, b).normalize();
      const k = (j * V + i) * 3;
      nor[k] = p.x;
      nor[k + 1] = p.y;
      nor[k + 2] = p.z;
    }
  }

  // Baked lighting in grid space: soft sun shadows (horizon marching) and sky occlusion.
  const cell = sq.size / seg;
  const sunH = Math.hypot(o.sun.x, o.sun.z);
  const tanSun = o.sun.y / Math.max(1e-4, sunH);
  const sdu = (o.sun.x * sq.right.x + o.sun.z * sq.right.z) / sunH;
  const sdv = (o.sun.x * sq.up.x + o.sun.z * sq.up.z) / sunH;
  const shade = new Float32Array(V * V * 2);
  const hAt = (x: number, y: number) => {
    const xi = Math.min(seg, Math.max(0, Math.round(x)));
    const yi = Math.min(seg, Math.max(0, Math.round(y)));
    return hKm[yi * V + xi];
  };
  const steps = Math.min(90, seg);
  const AO_DIRS = 6;
  const aoDirs = Array.from({ length: AO_DIRS }, (_, i) => [Math.cos((i / AO_DIRS) * Math.PI * 2 + 0.3), Math.sin((i / AO_DIRS) * Math.PI * 2 + 0.3)]);
  for (let j = 0; j < V; j++) {
    for (let i = 0; i < V; i++) {
      const k = j * V + i;
      const h0 = hKm[k];
      let maxTan = -1;
      for (let s = 1; s <= steps; s++) {
        const r = s * (1 + s * 0.02);
        const hs = hAt(i + sdu * r, j + sdv * r);
        const t = (hs - h0) / (r * cell);
        if (t > maxTan) maxTan = t;
        if (h0 + r * cell * (tanSun + 0.3) > 1.6) break;
      }
      const sh = 1 - 0.82 * THREE.MathUtils.smoothstep(maxTan - tanSun, -0.03, 0.07);
      let occ = 0;
      for (const [du, dv] of aoDirs) {
        let m = 0;
        for (let r = 1; r <= 24; r *= 1.6) {
          const t = (hAt(i + du * r, j + dv * r) - h0) / (r * cell);
          if (t > m) m = t;
        }
        occ += m / Math.sqrt(1 + m * m);
      }
      shade[k * 2] = sh;
      shade[k * 2 + 1] = 1 - 0.75 * (occ / AO_DIRS);
    }
    if (j % 24 === 23) await yieldFrame();
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setAttribute("aShade", new THREE.BufferAttribute(shade, 2));
  g.setAttribute("aH", new THREE.BufferAttribute(aH, 1));
  const idx = new (V * V > 65535 ? Uint32Array : Uint16Array)(seg * seg * 6);
  let q = 0;
  for (let j = 0; j < seg; j++) {
    for (let i = 0; i < seg; i++) {
      const k = j * V + i;
      // CCW seen from above (+Y): right = +u, up = +v maps to x east, −z north.
      idx[q++] = k;
      idx[q++] = k + 1;
      idx[q++] = k + V;
      idx[q++] = k + 1;
      idx[q++] = k + V + 1;
      idx[q++] = k + V;
    }
  }
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}
