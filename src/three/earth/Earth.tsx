"use client";

/**
 * Globe (NASA Blue Marble), the exact-sphere regional patch around Western Norway that takes
 * over when the camera comes close, the thin atmosphere, clouds, sky and stars.
 * All materials are created by the scene root; these components only build geometry.
 */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mulberry32 } from "../noise";
import { GLOBE_CENTRE, GLOBE_QUATERNION, R, toLocal } from "./geo";
import type { Rig } from "./rig";

export function Globe({ rig, segments }: { rig: Rig; segments: readonly [number, number] }) {
  // Depend on the numbers, not the array identity: a fresh array literal must not rebuild the spheres.
  const [ws, hs] = segments;
  const geo = useMemo(() => new THREE.SphereGeometry(R - 1.5, ws, hs), [ws, hs]);
  const clouds = useMemo(() => (rig.mats.clouds ? new THREE.SphereGeometry(R + 5, ws, hs) : null), [rig, ws, hs]);
  const atmo = useMemo(() => new THREE.SphereGeometry(R + 220, 96, 64), []);
  useEffect(
    () => () => {
      geo.dispose();
      clouds?.dispose();
      atmo.dispose();
    },
    [geo, clouds, atmo],
  );
  return (
    <group position={GLOBE_CENTRE} quaternion={GLOBE_QUATERNION}>
      <mesh ref={(m) => void (rig.globe = m ?? undefined)} geometry={geo} material={rig.mats.surface} />
      {clouds && rig.mats.clouds && <mesh ref={(m) => void (rig.clouds = m ?? undefined)} geometry={clouds} material={rig.mats.clouds} renderOrder={2} />}
      <mesh ref={(m) => void (rig.atmo = m ?? undefined)} geometry={atmo} material={rig.mats.atmo} renderOrder={3} />
    </group>
  );
}

/** Exact-sphere lon/lat grid (¼°) around Western Norway — replaces the coarse globe up close. */
export function RegionPatch({ rig, step }: { rig: Rig; step: number }) {
  const geo = useMemo(() => {
    const lon0 = -20, lon1 = 30, lat0 = 45, lat1 = 75;
    const nx = Math.round((lon1 - lon0) / step);
    const ny = Math.round((lat1 - lat0) / step);
    const V = (nx + 1) * (ny + 1);
    const pos = new Float32Array(V * 3);
    const nor = new Float32Array(V * 3);
    const uv = new Float32Array(V * 2);
    const p = new THREE.Vector3();
    for (let j = 0; j <= ny; j++) {
      const lat = lat0 + j * step;
      for (let i = 0; i <= nx; i++) {
        const lon = lon0 + i * step;
        const k = j * (nx + 1) + i;
        toLocal(lat, lon, 0, p);
        pos.set([p.x, p.y, p.z], k * 3);
        p.sub(GLOBE_CENTRE).divideScalar(R);
        nor.set([p.x, p.y, p.z], k * 3);
        uv[k * 2] = (lon + 180) / 360;
        uv[k * 2 + 1] = (lat + 90) / 180;
      }
    }
    const idx = new Uint32Array(nx * ny * 6);
    let q = 0;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * (nx + 1) + i;
        idx.set([k, k + 1, k + nx + 1, k + 1, k + nx + 2, k + nx + 1], q);
        q += 6;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    return g;
  }, [step]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh ref={(m) => void (rig.patch = m ?? undefined)} geometry={geo} material={rig.mats.surface} renderOrder={1} />;
}

export function Sky({ rig }: { rig: Rig }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh ref={(m) => void (rig.sky = m ?? undefined)} geometry={geo} material={rig.mats.sky} frustumCulled={false} renderOrder={-1000} />;
}

export function Stars({ rig, count }: { rig: Rig; count: number }) {
  const geo = useMemo(() => {
    const rnd = mulberry32(7);
    const pos = new Float32Array(count * 3);
    const mag = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([s * Math.cos(t), u, s * Math.sin(t)], i * 3);
      mag[i] = Math.pow(rnd(), 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aMag", new THREE.BufferAttribute(mag, 1));
    return g;
  }, [count]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <points ref={(m) => void (rig.stars = m ?? undefined)} geometry={geo} material={rig.mats.stars} frustumCulled={false} renderOrder={-999} />;
}
