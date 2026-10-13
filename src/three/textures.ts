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

export const STRATA_URL = "/textures/strata.webp";

/** Soil cross-section strata (pre-baked, see src/three/strata.ts). Loads asynchronously. */
export function strataTexture(): THREE.Texture {
  const key = "strata";
  if (cache.has(key)) return cache.get(key)!;
  const tex = new THREE.TextureLoader().load(STRATA_URL);
  tex.flipY = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
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
