"use client";

/**
 * Material library: scanned-stone aggregates and PBR sand for every verified
 * Envir fraction. One visual system reused by the scroll story, the product
 * carousel and the baked product renders (see scripts/render-assets.mjs).
 *
 * Stones: Poly Haven "Namaqualand Stones 01" + "Moon Rock 02" (CC0),
 * simplified to ~100–500 triangles each and meshopt-compressed.
 */

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./noise";
import { pbrTexture } from "./textures";

export const STONES_URL = "/assets/materials/stones.glb";
export const ROCK_URL = "/assets/materials/rock-grey.glb";

type Scan = { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial };

/** Loads the scanned stones, centres each mesh and normalises it to unit size. */
export function useScannedStones(): Scan[] {
  const a = useGLTF(STONES_URL);
  const b = useGLTF(ROCK_URL);
  return useMemo(() => {
    const out: Scan[] = [];
    for (const scene of [a.scene, b.scene]) {
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const g = m.geometry.clone();
        g.applyMatrix4(m.matrixWorld);
        g.computeBoundingBox();
        const box = g.boundingBox!;
        const c = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        g.translate(-c.x, -c.y, -c.z);
        const s = 1 / Math.max(size.x, size.y, size.z);
        g.scale(s, s, s);
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        mat.roughness = 1;
        out.push({ geometry: g, material: mat });
      });
    }
    return out;
  }, [a.scene, b.scene]);
}

/**
 * Visual parameters for each fraction. Sizes are the product's own mm range,
 * mapped to scene units with `MM` so relative scale between fractions is true.
 */
// Scene units per millimetre: a 0.5-unit plinth radius ≈ 20 cm of material.
export const MM = 0.0025;
export type FractionId = "0-2" | "0-8" | "0-16" | "0-32" | "2-8" | "8-16" | "16-32" | "16-64" | "32-64" | "64-90";

export const FRACTIONS: Record<FractionId, { min: number; max: number; sand: number; tint: string; scan: "warm" | "grey" | "mix" }> = {
  "0-2": { min: 0, max: 2, sand: 1, tint: "#ffffff", scan: "warm" },
  "0-8": { min: 0, max: 8, sand: 0.7, tint: "#d9d4ca", scan: "mix" },
  "0-16": { min: 0, max: 16, sand: 0.55, tint: "#d6d1c8", scan: "mix" },
  "0-32": { min: 0, max: 32, sand: 0.45, tint: "#cfcac1", scan: "mix" },
  "2-8": { min: 2, max: 8, sand: 0, tint: "#d8d2c6", scan: "warm" },
  "8-16": { min: 8, max: 16, sand: 0, tint: "#cfcbc3", scan: "mix" },
  "16-32": { min: 16, max: 32, sand: 0, tint: "#c9c7c2", scan: "grey" },
  "16-64": { min: 16, max: 64, sand: 0, tint: "#c6c4bf", scan: "grey" },
  "32-64": { min: 32, max: 64, sand: 0, tint: "#c2c0bb", scan: "grey" },
  "64-90": { min: 64, max: 90, sand: 0, tint: "#bdbbb6", scan: "grey" },
};

/** Fine sand pile with scanned PBR sand surface. */
export function SandMound({ radius = 0.45, height = 0.32, tint = "#d9c7a5", seed = 3, surface = "sand" }: { radius?: number; height?: number; tint?: string; seed?: number; surface?: "sand" | "gravel" }) {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(radius, height, 96, 16, true);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const rnd = mulberry32(seed);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = (y + height / 2) / height;
      // Angle-of-repose profile: slightly convex flanks, rounded crest.
      const k = 1 + (rnd() - 0.5) * 0.05 * (1 - t) + Math.sin(Math.atan2(pos.getZ(i), pos.getX(i)) * 5 + seed) * 0.03 * (1 - t);
      pos.setX(i, pos.getX(i) * k);
      pos.setZ(i, pos.getZ(i) * k);
      pos.setY(i, y - Math.pow(t, 6) * height * 0.08 + Math.sin(t * Math.PI) * height * 0.04);
    }
    g.computeVertexNormals();
    g.translate(0, height / 2, 0);
    return g;
  }, [radius, height, seed]);
  const mat = useMemo(() => {
    const map = pbrTexture(`/assets/materials/${surface}-albedo.webp`, { repeat: [4, 2], srgb: true });
    const normalMap = pbrTexture(`/assets/materials/${surface}-normal.webp`, { repeat: [4, 2] });
    return new THREE.MeshStandardMaterial({ map, normalMap, normalScale: new THREE.Vector2(0.7, 0.7), color: tint, roughness: 0.98 });
  }, [tint, surface]);
  return <mesh geometry={geo} material={mat} castShadow receiveShadow />;
}

/**
 * Instanced mound of scanned stones, sized to a real fraction (mm range).
 * `count` adapts automatically so coarse fractions use fewer, larger stones.
 */
export function ScannedAggregate({
  fraction,
  radius = 0.45,
  height = 0.3,
  budget = 1,
  seed = 1,
  reveal,
}: {
  fraction: FractionId;
  radius?: number;
  height?: number;
  /** Quality multiplier for instance count (0.3 on phones). */
  budget?: number;
  seed?: number;
  /** Optional 0–1 ref; stones drop into place from the top as it rises. */
  reveal?: React.RefObject<number>;
}) {
  const scans = useScannedStones();
  const f = FRACTIONS[fraction];
  const pool = useMemo(() => {
    const warm = scans.slice(0, Math.max(1, scans.length - 1));
    const grey = scans.slice(-1);
    // Washed Vestland aggregate is mostly grey granite/gneiss with some warmer stones.
    return f.scan === "warm" ? [...warm, ...grey] : f.scan === "grey" ? [...grey, ...grey, ...grey, warm[3] ?? warm[0]] : [...grey, ...grey, ...warm];
  }, [scans, f.scan]);

  // Rendered stones are kept ≥ 4 mm so fine fractions read as grains, not noise.
  const minS = Math.max(4, f.min) * MM;
  const maxS = Math.max(6, f.max) * MM;
  const avg = (minS + maxS) / 2;
  // Stones cover the visible surface of the heap (inner stones would be hidden anyway);
  // a scanned sand/gravel base mound fills any gaps, so every fraction reads as a full pile.
  const slant = Math.hypot(radius, height);
  const area = Math.PI * radius * slant;
  const count = f.sand >= 1 ? 0 : Math.round(THREE.MathUtils.clamp((area / (avg * avg * (f.min >= 32 ? 0.38 : 0.55))) * (1 - f.sand * 0.7), 30, 1600) * budget);

  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const placements = useMemo(() => {
    const rnd = mulberry32(seed + fraction.length * 13);
    return Array.from({ length: count }, () => {
      const r = radius * Math.sqrt(rnd()) * 0.97;
      const a = rnd() * Math.PI * 2;
      const s = minS + Math.pow(rnd(), 1.4) * (maxS - minS);
      const y = height * (1 - r / radius) + s * 0.22;
      return {
        k: Math.floor(rnd() * 1e6),
        pos: new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r),
        rot: new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28),
        scale: new THREE.Vector3(s * (0.85 + rnd() * 0.3), s * (0.7 + rnd() * 0.3), s * (0.85 + rnd() * 0.3)),
        shade: 0.85 + rnd() * 0.4,
        delay: 1 - r / radius,
      };
    });
  }, [count, radius, height, minS, maxS, seed, fraction]);

  const groups = useMemo(() => pool.map((_, gi) => placements.filter((p) => p.k % pool.length === gi)), [pool, placements]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);

  const write = (progress: number) => {
    groups.forEach((list, gi) => {
      const mesh = refs.current[gi];
      if (!mesh) return;
      list.forEach((p, i) => {
        const local = THREE.MathUtils.clamp(progress * 1.6 - p.delay * 0.6, 0, 1);
        const e = 1 - Math.pow(1 - local, 3);
        v.copy(p.pos);
        v.y += (1 - e) * 0.6;
        sc.copy(p.scale).multiplyScalar(Math.max(0.0001, e));
        q.setFromEuler(p.rot);
        m.compose(v, q, sc);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  };

  useLayoutEffect(() => {
    const tint = new THREE.Color(f.tint);
    const c = new THREE.Color();
    groups.forEach((list, gi) => {
      const mesh = refs.current[gi];
      if (!mesh) return;
      // Scans are dark under studio light; >1 multipliers lift them to washed-stone values.
      const greys = ["#ffffff", "#e6e3dc", "#d2cfc8", "#f2ebdc"];
      list.forEach((p, i) => mesh.setColorAt(i, c.set(greys[p.k % greys.length]).multiply(tint).multiplyScalar(p.shade * 1.55)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    write(reveal ? reveal.current : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, f.tint]);

  const last = useRef(-1);
  useFrame(() => {
    if (!reveal) return;
    const p = reveal.current;
    if (Math.abs(p - last.current) < 0.002) return;
    last.current = p;
    write(p);
  });

  return (
    <group>
      <SandMound
        radius={radius}
        height={height * (f.sand > 0 ? 1 : 0.97)}
        surface={f.sand > 0 ? "sand" : "gravel"}
        tint={f.sand >= 1 ? "#cdc3b0" : f.sand > 0 ? "#bdb6aa" : f.min >= 16 ? "#7d7c79" : "#9a9893"}
        seed={seed}
      />
      {f.sand < 1 &&
        groups.map((list, gi) =>
          list.length ? (
            <instancedMesh
              key={gi}
              ref={(el) => {
                refs.current[gi] = el;
              }}
              args={[pool[gi].geometry, pool[gi].material, list.length]}
              castShadow
              receiveShadow
            />
          ) : null,
        )}
    </group>
  );
}

/** Pedestal + sample: the shared "product on a plinth" presentation. */
export function MaterialSample({
  fraction,
  radius = 0.42,
  budget = 1,
  seed,
  ring = "#3d4a46",
  reveal,
}: {
  fraction: FractionId;
  radius?: number;
  budget?: number;
  seed?: number;
  ring?: string;
  reveal?: React.RefObject<number>;
}) {
  return (
    <group>
      <mesh position={[0, 0.07, 0]} receiveShadow>
        <cylinderGeometry args={[radius + 0.04, radius + 0.08, 0.14, 64]} />
        <meshStandardMaterial color="#1b2321" metalness={0.5} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.142, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius + 0.005, radius + 0.03, 72]} />
        <meshBasicMaterial color={ring} toneMapped={false} />
      </mesh>
      <group position={[0, 0.14, 0]}>
        <ScannedAggregate fraction={fraction} radius={radius} height={radius * 0.7} budget={budget} seed={seed} reveal={reveal} />
      </group>
    </group>
  );
}

useGLTF.preload(STONES_URL);
useGLTF.preload(ROCK_URL);
