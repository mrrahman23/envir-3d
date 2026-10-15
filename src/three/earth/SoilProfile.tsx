"use client";

/**
 * Schematic soil monolith (metres): turf, topsoil with scanned roots, sand, gravel, crushed
 * mineral material and bedrock. Adjacent slabs share one irregular boundary function, so the
 * block closes perfectly; the driver lifts each slab for the exploded view.
 * Textures: Poly Haven scans (CC0), see public/assets/geology. Roots are procedural.
 */
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import ScreenLabel from "../ScreenLabel";
import { mulberry32 } from "../noise";
import { loadTexture, type Tier, urls } from "./assets";
import { BLOCK, boundary, DEPTHS, LAYERS, n2 } from "./layers";
import type { Rig, SoilRig } from "./rig";
import { useDispose } from "./useDispose";

const LIFT_GAP = 0.34;
export const liftFor = (i: number) => (LAYERS.length - 1 - i) * LIFT_GAP;

type SlabSpec = { i: number; tile: number; seed: number };

function slabGeometry({ i, tile, seed }: SlabSpec, detail: number) {
  const { w, d } = BLOCK;
  const nx = Math.round(44 * detail);
  const nz = Math.round(28 * detail);
  const nv = Math.max(6, Math.round(10 * detail));
  const top = (x: number, z: number) => boundary(i, x, z);
  const bot = (x: number, z: number) => boundary(i + 1, x, z);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const rnd = mulberry32(seed);
  const ou = rnd();
  const ov = rnd();
  const colour = (x: number, y: number, z: number) => {
    // Natural variation + staining from the layer above near each upper boundary.
    let c = 1 + 0.16 * n2(x * 1.7 + z * 1.1 + seed, y * 2.4 + seed * 0.3);
    const depth = top(x, z) - y;
    if (i > 0) c *= THREE.MathUtils.lerp(0.7, 1, THREE.MathUtils.smoothstep(depth, 0, 0.12));
    if (i === 0) c *= THREE.MathUtils.lerp(0.82, 1.18, THREE.MathUtils.smoothstep(depth, 0.08, 0.34));
    col.push(c, c * (i === 0 ? 0.98 : 1), c * (i === 0 ? 0.95 : 1));
  };
  const grid = (h: (x: number, z: number) => number, up: boolean) => {
    const base = pos.length / 3;
    for (let j = 0; j <= nz; j++) {
      for (let k = 0; k <= nx; k++) {
        const x = -w / 2 + (k / nx) * w;
        const z = -d / 2 + (j / nz) * d;
        const y = h(x, z);
        pos.push(x, y, z);
        const e = 0.01;
        const nn = new THREE.Vector3(-(h(x + e, z) - h(x - e, z)) / (2 * e), 1, -(h(x, z + e) - h(x, z - e)) / (2 * e)).normalize();
        if (!up) nn.negate();
        nor.push(nn.x, nn.y, nn.z);
        uv.push(x / tile + ou, z / tile + ov);
        colour(x, y, z);
      }
    }
    for (let j = 0; j < nz; j++) {
      for (let k = 0; k < nx; k++) {
        const a = base + j * (nx + 1) + k;
        const b = a + 1;
        const c = a + nx + 1;
        const e = c + 1;
        if (up) idx.push(a, c, b, b, c, e);
        else idx.push(a, b, c, b, e, c);
      }
    }
  };
  grid(top, true);
  const topCount = idx.length;
  grid(bot, false);
  // Four cut faces, walked around the perimeter so texture runs continuously over the corners.
  const sides: [number, number, number, number, number, number, number][] = [
    // x0, z0, dx, dz, length, nx, nz
    [-w / 2, d / 2, 1, 0, w, 0, 1],
    [w / 2, d / 2, 0, -1, d, 1, 0],
    [w / 2, -d / 2, -1, 0, w, 0, -1],
    [-w / 2, -d / 2, 0, 1, d, -1, 0],
  ];
  let s0 = 0;
  for (const [x0, z0, dx, dz, len, sx, sz] of sides) {
    const n = Math.round((len / w) * nx);
    const base = pos.length / 3;
    for (let a = 0; a <= n; a++) {
      const t = a / n;
      const x = x0 + dx * len * t;
      const z = z0 + dz * len * t;
      const yt = top(x, z);
      const yb = bot(x, z);
      for (let b = 0; b <= nv; b++) {
        const y = yb + ((yt - yb) * b) / nv;
        pos.push(x, y, z);
        nor.push(sx, 0, sz);
        uv.push((s0 + len * t) / tile + ou, y / tile + ov);
        colour(x, y, z);
      }
    }
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < nv; b++) {
        const p = base + a * (nv + 1) + b;
        const q = p + nv + 1;
        idx.push(p, q, p + 1, q, q + 1, p + 1);
      }
    }
    s0 += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.addGroup(0, topCount, 0);
  g.addGroup(topCount, idx.length - topCount, 1);
  g.computeBoundingSphere();
  return g;
}

type LayerMats = THREE.MeshStandardMaterial[];

async function loadMaterials(tier: Tier, anisotropy: number) {
  const u = urls(tier);
  const make = async (id: Parameters<typeof u.geology>[0]) => {
    const g = u.geology(id);
    const [map, normal, rough] = await Promise.all([
      loadTexture(g.map, { repeat: true, anisotropy }),
      g.normal ? loadTexture(g.normal, { srgb: false, repeat: true, anisotropy }) : null,
      g.rough ? loadTexture(g.rough, { srgb: false, repeat: true, anisotropy }) : null,
    ]);
    return new THREE.MeshStandardMaterial({
      map,
      normalMap: normal,
      normalScale: new THREE.Vector2(1, 1),
      roughnessMap: rough,
      roughness: 1,
      metalness: 0,
      vertexColors: true,
    });
  };
  const [turf, ...layers] = await Promise.all([make("turf"), ...LAYERS.map((l) => make(l.id))]);
  // Gentle grading of the scans: a living lawn, and bedrock that reads as cool grey rock, not soil.
  turf.color.setRGB(0.86, 1.04, 0.72);
  // Fresh crushed rock reads slightly cooler than the weathered, rounded gravel above it.
  layers[3].color.setRGB(0.95, 0.98, 1.03);
  const rock = layers[LAYERS.length - 1];
  rock.color.setRGB(1.05, 1.08, 1.12);
  rock.normalScale.set(1.8, 1.8);
  rock.roughness = 0.9;
  rock.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <map_fragment>",
      "#include <map_fragment>\n  diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11))), diffuseColor.rgb, 0.3);",
    );
  };
  return { turf, layers };
}

export default function SoilProfile({ rig, tier, shadows }: { rig: Rig; tier: Tier; shadows: boolean }) {
  const { gl, camera, scene } = useThree();
  const [mats, setMats] = useState<{ turf: THREE.MeshStandardMaterial; layers: LayerMats } | null>(null);
  const detail = tier === "high" ? 1 : tier === "medium" ? 0.8 : 0.6;
  const geos = useMemo(() => LAYERS.map((l, i) => slabGeometry({ i, tile: l.tile, seed: i * 13 + 5 }, detail)), [detail]);
  const soil = useMemo<SoilRig>(
    () => ({
      group: new THREE.Group(),
      slabs: LAYERS.map(() => new THREE.Group()),
    }),
    [],
  );

  useEffect(() => {
    let alive = true;
    loadMaterials(tier, Math.min(8, gl.capabilities.getMaxAnisotropy()))
      .then((m) => {
        if (!alive) return;
        for (const mat of [m.turf, ...m.layers]) for (const t of [mat.map, mat.normalMap, mat.roughnessMap]) if (t) gl.initTexture(t);
        setMats(m);
      })
      .catch((e) => console.warn("[EarthStory] geology textures failed:", e));
    return () => {
      alive = false;
    };
  }, [tier, gl]);

  useEffect(() => {
    rig.soil = soil;
    return () => {
      rig.soil = undefined;
    };
  }, [rig, soil]);

  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  useEffect(
    () => () => {
      if (mats) [mats.turf, ...mats.layers].forEach((m) => m.dispose());
    },
    [mats],
  );

  useEffect(() => {
    if (!mats) return;
    const prev = soil.group.visible;
    soil.group.visible = true;
    gl.compileAsync(soil.group, camera, scene).catch(() => undefined);
    soil.group.visible = prev;
  }, [mats, soil, gl, camera, scene]);

  if (!mats) return <primitive object={soil.group} visible={false} />;
  return (
    <primitive object={soil.group} visible={false}>
      {LAYERS.map((l, i) => {
        const yTop = i === 0 ? 0 : -DEPTHS[i];
        const yBot = i === LAYERS.length - 1 ? BLOCK.bottom : -DEPTHS[i + 1];
        return (
          <primitive key={l.id} object={soil.slabs[i]}>
            <mesh geometry={geos[i]} material={[i === 0 ? mats.turf : mats.layers[i], mats.layers[i]]} castShadow={shadows} receiveShadow={shadows} />
            <ScreenLabel
              position={[BLOCK.w / 2 + 0.05, (yTop + yBot) / 2, -BLOCK.d / 2]}
              badge={l.name}
              text={l.line}
              zIndex={4}
              className={LABEL_CLASS[i]}
              badgeClassName="relative block font-display text-[0.95rem] font-semibold tracking-tight text-white before:absolute before:-left-6 before:top-1/2 before:h-px before:w-4 before:bg-lime/80 max-sm:text-[0.8rem]"
            />
            {i === 0 && tier !== "low" && <Grass count={tier === "high" ? 14000 : 8000} />}
            {i === 0 && <Roots count={tier === "low" ? 160 : 340} shadows={shadows} />}
          </primitive>
        );
      })}
      <Floor />
    </primitive>
  );
}

// Per-layer opacity comes from a CSS variable the driver sets on the canvas host (ScreenLabel owns inline opacity).
const LABEL_BASE =
  "w-max max-w-[15rem] text-[0.78rem] leading-snug text-white/70 [translate:calc(50%+30px)_0] [text-shadow:0_1px_10px_rgba(7,24,26,0.85)] [&>span]:transition-none max-sm:max-w-[7.25rem] max-sm:text-[0.66rem] max-sm:[translate:calc(50%+18px)_0]";
const LABEL_CLASS = [
  `${LABEL_BASE} [&>span]:[opacity:var(--geo-l0,0)]`,
  `${LABEL_BASE} [&>span]:[opacity:var(--geo-l1,0)]`,
  `${LABEL_BASE} [&>span]:[opacity:var(--geo-l2,0)]`,
  `${LABEL_BASE} [&>span]:[opacity:var(--geo-l3,0)]`,
  `${LABEL_BASE} [&>span]:[opacity:var(--geo-l4,0)]`,
];

/** Short lawn on the turf: thin bent blades, darker at the base. */
function Grass({ count }: { count: number }) {
  const { geo, mat, mesh } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // A tapered 3-segment blade, 1 unit tall.
    const p = [-0.5, 0, 0, 0.5, 0, 0, -0.38, 0.35, 0, 0.38, 0.35, 0, -0.22, 0.7, 0, 0.22, 0.7, 0, 0, 1, 0];
    const c: number[] = [];
    for (let i = 0; i < 7; i++) {
      const y = p[i * 3 + 1];
      const k = 0.35 + 0.65 * y;
      c.push(k, k, k);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(Array.from({ length: 7 }, () => [0, 0, 1]).flat(), 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
    g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]);
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
    const mesh = new THREE.InstancedMesh(g, m, count);
    const rnd = mulberry32(42);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const greens = ["#5d6b2f", "#6f7a36", "#4f5d2a", "#7d7a45", "#8a7d4e"];
    for (let i = 0; i < count; i++) {
      const x = (rnd() - 0.5) * (BLOCK.w - 0.02);
      const z = (rnd() - 0.5) * (BLOCK.d - 0.02);
      o.position.set(x, boundary(0, x, z) - 0.004, z);
      const h = 0.025 + rnd() * rnd() * 0.06;
      o.rotation.set((rnd() - 0.5) * 0.7, rnd() * Math.PI, (rnd() - 0.5) * 0.7);
      o.scale.set(0.004 + rnd() * 0.003, h, 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      col.set(greens[Math.floor(rnd() * greens.length)]).multiplyScalar(0.75 + rnd() * 0.4);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return { geo: g, mat: m, mesh };
  }, [count]);
  useDispose(geo, mat, mesh);
  return <primitive object={mesh} />;
}

/**
 * Root system of the topsoil: tapered roots that run down the two visible cut faces (half
 * embedded, as on a freshly cut profile), plus fine roots that hang a few centimetres below the
 * sod — hidden inside the sand when the block is closed, visible when the layers separate.
 */
function Roots({ count, shadows }: { count: number; shadows: boolean }) {
  const { geo, mat } = useMemo(() => {
    const rnd = mulberry32(11);
    const pos: number[] = [];
    const nor: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const SIDES = 6;
    const v = new THREE.Vector3();
    const tube = (pts: THREE.Vector3[], r0: number, r1: number, tint: number) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const n = Math.max(6, Math.round(curve.getLength() / 0.012));
      const frames = curve.computeFrenetFrames(n, false);
      const base = pos.length / 3;
      const c = new THREE.Color().setHSL(0.08 + rnd() * 0.02, 0.3 + rnd() * 0.12, 0.42 + tint * 0.2);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const p = curve.getPointAt(t);
        const r = THREE.MathUtils.lerp(r0, r1, Math.pow(t, 0.7));
        for (let k = 0; k < SIDES; k++) {
          const a = (k / SIDES) * Math.PI * 2;
          v.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
          pos.push(p.x + v.x * r, p.y + v.y * r, p.z + v.z * r);
          nor.push(v.x, v.y, v.z);
          const k2 = 0.85 + 0.3 * rnd();
          col.push(c.r * k2, c.g * k2, c.b * k2);
        }
      }
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < SIDES; k++) {
          const a = base + i * SIDES + k;
          const b = base + i * SIDES + ((k + 1) % SIDES);
          idx.push(a, a + SIDES, b, b, a + SIDES, b + SIDES);
        }
      }
    };
    const { w, d } = BLOCK;
    const bottom = (x: number, z: number) => boundary(1, x, z);
    // Paths on a face: u runs along the face, the root wanders downwards with gentle curls.
    const facePath = (face: 0 | 1, u0: number, y0: number, len: number, r: number) => {
      const pts: THREE.Vector3[] = [];
      let u = u0;
      let y = y0;
      let du = (rnd() - 0.5) * 0.6;
      const steps = 6 + Math.floor(len / 0.05);
      for (let i = 0; i <= steps; i++) {
        const along = face === 0 ? THREE.MathUtils.clamp(u, -w / 2 + 0.01, w / 2 - 0.01) : THREE.MathUtils.clamp(u, -d / 2 + 0.01, d / 2 - 0.01);
        const inset = r * (0.05 + 0.3 * rnd());
        pts.push(face === 0 ? new THREE.Vector3(along, y, d / 2 - inset) : new THREE.Vector3(w / 2 - inset, y, along));
        du += (rnd() - 0.5) * 0.5;
        du *= 0.8;
        u += du * (len / steps);
        y -= (len / steps) * (0.75 + 0.25 * rnd());
      }
      return pts;
    };
    const faces = Math.round(count * 0.55);
    for (let i = 0; i < faces; i++) {
      const face = rnd() < 0.62 ? 0 : 1;
      const span = face === 0 ? w : d;
      const u0 = (rnd() - 0.5) * span * 0.96;
      const thick = rnd() < 0.18;
      const r = thick ? 0.004 + rnd() * 0.004 : 0.0016 + rnd() * 0.0016;
      const x0 = face === 0 ? u0 : w / 2;
      const z0 = face === 0 ? d / 2 : u0;
      const yb = bottom(x0, z0);
      const len = Math.min(-yb - 0.02, (thick ? 0.18 : 0.06) + rnd() * 0.22);
      const pts = facePath(face, u0, -0.012 - rnd() * 0.02, len, r);
      tube(pts, r, r * 0.25, rnd());
      // a few side branches
      if (thick) {
        for (let b = 0; b < 3; b++) {
          const at = pts[1 + Math.floor(rnd() * (pts.length - 2))];
          const u = face === 0 ? at.x : at.z;
          tube(facePath(face, u, at.y, 0.05 + rnd() * 0.1, r * 0.4), r * 0.4, r * 0.1, rnd());
        }
      }
    }
    // Fine roots hanging from the underside of the sod.
    for (let i = faces; i < count; i++) {
      const x = (rnd() - 0.5) * (w - 0.08);
      const z = (rnd() - 0.5) * (d - 0.08);
      const y0 = bottom(x, z) + 0.02;
      const len = 0.03 + rnd() * rnd() * 0.12;
      const pts: THREE.Vector3[] = [];
      let px = x, pz = z;
      for (let k = 0; k <= 5; k++) {
        pts.push(new THREE.Vector3(px, y0 - (k / 5) * len, pz));
        px += (rnd() - 0.5) * 0.012;
        pz += (rnd() - 0.5) * 0.012;
      }
      const r = 0.0007 + rnd() * 0.0012;
      tube(pts, r, r * 0.3, rnd());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    return { geo: g, mat: m };
  }, [count]);
  useDispose(geo, mat);
  return <mesh geometry={geo} material={mat} castShadow={shadows} />;
}

/** Soft contact shadow under the monolith (slabs shadow each other via the shadow map on high tier). */
function Floor() {
  const blob = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.75)");
    g.addColorStop(0.55, "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  useEffect(() => () => blob.dispose(), [blob]);
  return (
    <group position={[0, BLOCK.bottom - 0.002, 0]}>
      <mesh rotation-x={-Math.PI / 2} scale={[BLOCK.w * 2.1, BLOCK.d * 2.4, 1]} renderOrder={1}>
        <planeGeometry />
        <meshBasicMaterial map={blob} transparent depthWrite={false} color="#000000" />
      </mesh>
    </group>
  );
}
