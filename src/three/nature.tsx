"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { HeightFn } from "./kit";
import { fbm, mulberry32 } from "./noise";

/** Paints a vertical gradient (dark base → lighter tips) into vertex colours. */
function shadeByHeight(g0: THREE.BufferGeometry, bottom: THREE.Color, top: THREE.Color) {
  const g = g0.index ? g0.toNonIndexed() : g0;
  
  g.computeBoundingBox();
  const { min, max } = g.boundingBox!;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - min.y) / Math.max(1e-6, max.y - min.y);
    c.copy(bottom).lerp(top, Math.pow(t, 0.8));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/** Norway spruce: three stacked, slightly irregular tiers on a short trunk. Unit height ≈ 1. */
function firGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const tiers = [
    { r: 0.34, h: 0.46, y: 0.36 },
    { r: 0.27, h: 0.4, y: 0.58 },
    { r: 0.18, h: 0.34, y: 0.8 },
  ];
  const rnd = mulberry32(5);
  for (const t of tiers) {
    const g = new THREE.ConeGeometry(t.r, t.h, 9, 2, false);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < t.h / 2 - 0.01) {
        const k = 0.86 + rnd() * 0.28;
        pos.setX(i, pos.getX(i) * k);
        pos.setZ(i, pos.getZ(i) * k);
      }
    }
    g.translate(0, t.y, 0);
    parts.push(shadeByHeight(g, new THREE.Color("#0f2116"), new THREE.Color("#2f5636")));
  }
  const trunk = new THREE.CylinderGeometry(0.025, 0.035, 0.22, 6).translate(0, 0.11, 0);
  parts.push(shadeByHeight(trunk, new THREE.Color("#2a1d14"), new THREE.Color("#3d2b1e")));
  const g = mergeGeometries(parts.map((p) => (p.deleteAttribute("uv"), p)));
  g.computeVertexNormals();
  return g;
}

/** Birch / rowan style crown: a lumpy icosphere on a pale trunk. */
function leafyGeometry() {
  const crown = new THREE.IcosahedronGeometry(0.26, 1);
  const pos = crown.attributes.position as THREE.BufferAttribute;
  const rnd = mulberry32(9);
  for (let i = 0; i < pos.count; i++) {
    const k = 0.82 + rnd() * 0.3;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 1.15, pos.getZ(i) * k);
  }
  crown.translate(0, 0.62, 0);
  const trunk = new THREE.CylinderGeometry(0.018, 0.026, 0.42, 6).translate(0, 0.21, 0);
  const g = mergeGeometries([
    shadeByHeight(crown, new THREE.Color("#33502a"), new THREE.Color("#7c9a4c")),
    shadeByHeight(trunk, new THREE.Color("#b9b4a6"), new THREE.Color("#ded9cc")),
  ].map((p) => (p.deleteAttribute("uv"), p)));
  g.computeVertexNormals();
  return g;
}

type Spot = { x: number; z: number; r: number };

/**
 * Clustered Scandinavian forest: dense spruce stands with birch along the edges.
 * Two instanced meshes, so cost stays flat regardless of tree count.
 */
export function Forest({
  count = 200,
  area,
  height,
  avoid = [],
  scale = 0.4,
  seed = 3,
  leafy = 0.25,
  tint = "#ffffff",
  castShadow = false,
  clip,
}: {
  count?: number;
  area: [number, number];
  height: HeightFn;
  avoid?: Spot[];
  scale?: number;
  seed?: number;
  /** Share of deciduous trees (0–1). */
  leafy?: number;
  /** Multiplies all foliage colours (e.g. brighter for daylight scenes). */
  tint?: string;
  castShadow?: boolean;
  clip?: THREE.Plane[];
}) {
  const firRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const firGeo = useMemo(() => firGeometry(), []);
  const leafGeo = useMemo(() => leafyGeometry(), []);
  const { firs, leaves } = useMemo(() => {
    const rnd = mulberry32(seed);
    const firs: { x: number; y: number; z: number; s: number; r: number; c: number }[] = [];
    const leaves: typeof firs = [];
    let guard = 0;
    while (firs.length + leaves.length < count && guard++ < count * 30) {
      const x = (rnd() - 0.5) * area[0];
      const z = (rnd() - 0.5) * area[1];
      if (avoid.some((a) => Math.hypot(x - a.x, z - a.z) < a.r)) continue;
      const density = fbm(x * 0.55 + seed, z * 0.55 - seed, 3);
      if (density < 0.4) continue;
      // Deciduous trees prefer stand edges (lower density).
      const isLeafy = rnd() < leafy * (1.6 - density * 1.4);
      const s = scale * (0.65 + rnd() * 0.6) * (isLeafy ? 0.85 : 1);
      (isLeafy ? leaves : firs).push({ x, z, y: height(x, z) - 0.01, s, r: rnd() * Math.PI * 2, c: 0.78 + rnd() * 0.36 });
    }
    return { firs, leaves };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed, scale, leafy]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const base = new THREE.Color(tint);
    const c = new THREE.Color();
    const fill = (mesh: THREE.InstancedMesh | null, list: typeof firs) => {
      if (!mesh) return;
      list.forEach((t, i) => {
        q.setFromAxisAngle(up, t.r);
        m.compose(new THREE.Vector3(t.x, t.y, t.z), q, new THREE.Vector3(t.s, t.s * (0.9 + (i % 5) * 0.06), t.s));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, c.copy(base).multiplyScalar(t.c));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    fill(firRef.current, firs);
    fill(leafRef.current, leaves);
  }, [firs, leaves, tint]);

  useLayoutEffect(() => () => {
    firGeo.dispose();
    leafGeo.dispose();
  }, [firGeo, leafGeo]);

  return (
    <group>
      {firs.length > 0 && (
        <instancedMesh ref={firRef} args={[firGeo, undefined, firs.length]} castShadow={castShadow}>
          <meshStandardMaterial vertexColors roughness={0.92} metalness={0} flatShading clippingPlanes={clip ?? null} />
        </instancedMesh>
      )}
      {leaves.length > 0 && (
        <instancedMesh ref={leafRef} args={[leafGeo, undefined, leaves.length]} castShadow={castShadow}>
          <meshStandardMaterial vertexColors roughness={0.88} metalness={0} flatShading clippingPlanes={clip ?? null} />
        </instancedMesh>
      )}
    </group>
  );
}
