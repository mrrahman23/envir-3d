"use client";

/**
 * Sentinel-2 imagery draped on Copernicus DEM relief: the 36 km Bergen square and the
 * 6 km Laksevåg detail square. Loaded lazily (after the scene is ready), built once on the CPU.
 */
import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BERGEN, DETAIL, type Square } from "./geo";
import { buildTerrain, loadHeights, loadTexture } from "./assets";
import type { Rig } from "./rig";
import { SUN } from "./rig";

export const EXAGGERATION = 1.45;

type Props = {
  rig: Rig;
  kind: "big" | "detail";
  map: string;
  dem: string;
  segments: number;
  anisotropy: number;
  onReady?: () => void;
};

const SPEC = {
  big: { square: BERGEN, max: 984, packed: false, taper: 0.05, feather: 0.06 },
  detail: { square: DETAIL, max: 473, packed: true, taper: 0, feather: 0.09 },
};

/** Ground height sampler (km, exaggerated) for one square, from its DEM. */
function sampler(sq: Square, heights: Float32Array, n: number) {
  return (x: number, z: number) => {
    const rx = x - sq.origin.x;
    const rz = z - sq.origin.z;
    const u = (rx * sq.right.x + rz * sq.right.z) / sq.size;
    const v = (rx * sq.up.x + rz * sq.up.z) / sq.size;
    if (u < 0 || u > 1 || v < 0 || v > 1) return NaN;
    const px = Math.min(n - 1, Math.max(0, Math.round(u * n - 0.5)));
    const py = Math.min(n - 1, Math.max(0, Math.round((1 - v) * n - 0.5)));
    return (heights[py * n + px] / 1000) * EXAGGERATION;
  };
}

const samplers: { big?: (x: number, z: number) => number; detail?: (x: number, z: number) => number } = {};

export default function Terrain({ rig, kind, map, dem, segments, anisotropy, onReady }: Props) {
  const { gl, camera, scene } = useThree();
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const mat = kind === "big" ? rig.mats.terrainBig : rig.mats.terrainDetail;
  const ready = useRef(onReady);
  useLayoutEffect(() => {
    ready.current = onReady;
  });

  useEffect(() => {
    let alive = true;
    let built: THREE.BufferGeometry | null = null;
    const spec = SPEC[kind];
    (async () => {
      const [tex, h] = await Promise.all([loadTexture(map, { anisotropy }), loadHeights(dem, spec.max, spec.packed)]);
      if (!alive) return;
      gl.initTexture(tex);
      mat.uniforms.uMap.value = tex;
      mat.uniforms.uFeather.value = spec.feather;
      if (kind === "big") rig.mats.surface.uniforms.uBergen.value = tex;
      built = await buildTerrain(spec.square, h, { segments, exaggeration: EXAGGERATION, taper: spec.taper, sun: SUN });
      if (!alive) {
        built.dispose();
        return;
      }
      samplers[kind] = sampler(spec.square, h.heights, h.n);
      rig.ground = (x, z) => {
        const d = samplers.detail?.(x, z);
        if (d !== undefined && !Number.isNaN(d)) return d;
        const b = samplers.big?.(x, z);
        return b !== undefined && !Number.isNaN(b) ? b : 0;
      };
      setGeo(built);
    })().catch((e) => console.warn("[EarthStory] terrain failed to load:", e));
    return () => {
      alive = false;
      delete samplers[kind];
      built?.dispose();
    };
  }, [kind, map, dem, segments, anisotropy, gl, mat, rig]);

  // Compile the program off the critical path as soon as the geometry exists.
  useEffect(() => {
    if (!geo) return;
    const m = kind === "big" ? rig.terrain : rig.detail;
    if (!m) return;
    const prev = m.visible;
    m.visible = true;
    gl.compileAsync(m, camera, scene).catch(() => undefined);
    m.visible = prev;
    ready.current?.();
  }, [geo, gl, camera, scene, kind, rig]);

  if (!geo) return null;
  return (
    <mesh
      ref={(m) => {
        if (kind === "big") rig.terrain = m ?? undefined;
        else rig.detail = m ?? undefined;
      }}
      geometry={geo}
      material={mat}
      renderOrder={kind === "big" ? 4 : 5}
      visible={false}
    />
  );
}
