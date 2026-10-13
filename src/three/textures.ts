import * as THREE from "three";
import { mulberry32 } from "./noise";

/** Procedural textures generated once on the client and cached. */
const cache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

/** Cached loader for the optimised PBR textures in public/assets (CC0 scans, see ASSETS.md). */
export function pbrTexture(url: string, { repeat = 1, srgb = false }: { repeat?: number | [number, number]; srgb?: boolean } = {}): THREE.Texture {
  const r = Array.isArray(repeat) ? repeat : [repeat, repeat];
  const key = `${url}|${r.join("x")}`;
  if (cache.has(key)) return cache.get(key)!;
  const tex = new THREE.TextureLoader().load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(r[0], r[1]);
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Earth cross-section atlas baked from scanned soil, sand, gravel and rock (scripts/bake-earth.mjs). */
export const STRATA_ALBEDO = "/assets/earth/strata-albedo.webp";
export const STRATA_NORMAL = "/assets/earth/strata-normal.webp";
/** Width / height of the strata atlas — keeps stones round on the cut faces. */
export const STRATA_ASPECT = 768 / 1728;

export function strataTextures() {
  const map = pbrTexture(STRATA_ALBEDO, { srgb: true });
  const normalMap = pbrTexture(STRATA_NORMAL);
  map.wrapT = normalMap.wrapT = THREE.ClampToEdgeWrapping;
  return { map, normalMap };
}

/** Ribbed rubber conveyor belt (scroll via offset.x). */
export function beltTexture(): THREE.Texture {
  const key = "belt";
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = canvas(256, 32);
  ctx.fillStyle = "#1b1e1f";
  ctx.fillRect(0, 0, 256, 32);
  for (let x = 0; x < 256; x += 16) {
    ctx.fillStyle = "#2c3133";
    ctx.fillRect(x, 0, 5, 32);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Fine granular noise used for sand piles and ground. */
export function grainTexture(base: [number, number, number], key: string, spread = 0.35): THREE.Texture {
  if (cache.has(key)) return cache.get(key)!;
  const S = 256;
  const [c, ctx] = canvas(S, S);
  const img = ctx.createImageData(S, S);
  const rnd = mulberry32(key.length * 31);
  for (let i = 0; i < S * S; i++) {
    const k = 1 - spread / 2 + rnd() * spread;
    img.data[i * 4] = Math.min(255, base[0] * k);
    img.data[i * 4 + 1] = Math.min(255, base[1] * k);
    img.data[i * 4 + 2] = Math.min(255, base[2] * k);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

/** Vertical corrugated cladding profile, used as a bump map on hall façades. */
export function corrugatedTexture(): THREE.Texture {
  const key = "corrugated";
  if (cache.has(key)) return cache.get(key)!;
  const [c, ctx] = canvas(64, 4);
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  for (let i = 0; i <= 8; i++) {
    g.addColorStop(i / 8, i % 2 ? "#ffffff" : "#5a5a5a");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}
