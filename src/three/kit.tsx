"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fbm, mulberry32 } from "./noise";
import { beltTexture, grainTexture, strataTexture } from "./textures";

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

export function StudioLights({ intensity = 1, warm = "#ffe2bd", cool = "#7fc6ff", shadows = false, envIntensity = 0.7, env = true }) {
  return (
    <>
      <hemisphereLight args={["#a9cfdc", "#2a1e14", 0.55 * intensity]} />
      <directionalLight
        position={[7, 11, 6]}
        intensity={2.3 * intensity}
        color={warm}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 4, -9]} intensity={1.1 * intensity} color={cool} />
      {env ? (
        <Environment resolution={128} frames={1} environmentIntensity={envIntensity}>
          <Lightformer form="rect" intensity={2.2} color="#fff4e2" position={[0, 6, 4]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#9fd8ea" position={[-6, 2, -4]} rotation-y={Math.PI / 3} scale={[6, 4, 1]} />
          <Lightformer form="ring" intensity={1.4} color="#b9d95a" position={[6, 1, -2]} scale={2} />
        </Environment>
      ) : (
        // Low tier: skip the PMREM pass; a brighter fill keeps metals readable.
        <ambientLight intensity={0.55 * intensity} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const dustVert = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uBounds;
  uniform float uRise;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime + aSeed * 97.0;
    p.y = mod(p.y + uTime * uRise * (0.4 + aSeed) + uBounds.y * 0.5, uBounds.y) - uBounds.y * 0.5;
    p.x += sin(t * 0.31 + aSeed * 6.0) * 0.18;
    p.z += cos(t * 0.23 + aSeed * 4.0) * 0.18;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (90.0 / -mv.z);
    vColor = aColor;
    vAlpha = smoothstep(uBounds.y * 0.5, uBounds.y * 0.3, abs(p.y)) * (0.55 + 0.45 * sin(t * 1.7));
  }
`;
const dustFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Floating mineral particles drifting in a volume. */
export function DustField({
  count = 600,
  bounds = [12, 6, 8] as [number, number, number],
  position = [0, 0, 0] as [number, number, number],
  palette = ["#c9a77c", "#8a6a4a", "#d9d2c3", "#b9d95a"],
  glint = 0.06,
  size = [0.6, 2.2] as [number, number],
  rise = 0.06,
  opacity = 0.9,
}) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geo, mat } = useMemo(() => {
    const rnd = mulberry32(count);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const seed = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * bounds[0];
      pos[i * 3 + 1] = (rnd() - 0.5) * bounds[1];
      pos[i * 3 + 2] = (rnd() - 0.5) * bounds[2];
      const isGlint = rnd() < glint;
      c.set(isGlint ? palette[palette.length - 1] : palette[Math.floor(rnd() * (palette.length - 1))]);
      col.set([c.r, c.g, c.b], i * 3);
      sz[i] = (size[0] + rnd() * (size[1] - size[0])) * (isGlint ? 1.4 : 1);
      seed[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uBounds: { value: new THREE.Vector3(...bounds) },
        uRise: { value: rise },
        uOpacity: { value: opacity },
      },
    });
    return { geo: g, mat: m };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  useLayoutEffect(() => {
    mat.uniforms.uPixelRatio.value = dpr;
  }, [dpr, mat]);
  useLayoutEffect(() => {
    mat.uniforms.uOpacity.value = opacity;
  }, [opacity, mat]);
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });
  useLayoutEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  return <points geometry={geo} material={mat} position={position} frustumCulled={false} />;
}

const flowVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const flowFrag = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float x = fract(vUv.x * uDensity - uTime * uSpeed);
    float pulse = smoothstep(0.0, 0.12, x) * smoothstep(0.7, 0.12, x);
    float ends = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
    float a = (0.18 + pulse * 0.82) * ends * uOpacity;
    gl_FragColor = vec4(uColor * (0.55 + pulse * 0.9), a * 0.8);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Luminous animated stream along a curve (water / process energy). */
export function FlowLine({
  points,
  color = "#b9d95a",
  radius = 0.02,
  speed = 0.35,
  density = 4,
  opacity = 1,
}: {
  points: [number, number, number][];
  color?: string;
  radius?: number;
  speed?: number;
  density?: number;
  opacity?: number;
}) {
  const pointsKey = JSON.stringify(points);
  const { geo, mat } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3((JSON.parse(pointsKey) as [number, number, number][]).map((p) => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, 120, radius, 6, false);
    const m = new THREE.ShaderMaterial({
      vertexShader: flowVert,
      fragmentShader: flowFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uDensity: { value: density },
        uOpacity: { value: opacity },
        uColor: { value: new THREE.Color(color) },
      },
    });
    return { geo: g, mat: m };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, radius, color]);
  useLayoutEffect(() => {
    mat.uniforms.uOpacity.value = opacity;
  }, [opacity, mat]);
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });
  useLayoutEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  return <mesh geometry={geo} material={mat} />;
}

/* ------------------------------------------------------------------ */
/* Terrain block with soil cross-section                              */
/* ------------------------------------------------------------------ */

export type HeightFn = (x: number, z: number) => number;

export function makeHeightFn({ amp = 0.55, scale = 0.32, flat }: { amp?: number; scale?: number; flat?: { x: number; z: number; r: number; h: number } }): HeightFn {
  return (x, z) => {
    let h = 0.12 + fbm(x * scale + 3.1, z * scale + 7.7, 4) * amp;
    if (flat) {
      const d = Math.hypot(x - flat.x, z - flat.z);
      const t = THREE.MathUtils.smoothstep(d, flat.r * 0.75, flat.r * 1.25);
      h = THREE.MathUtils.lerp(flat.h, h, t);
    }
    return h;
  };
}

export function EarthBlock({
  size = [6, 6] as [number, number],
  depth = 3,
  height,
  segments = 96,
  grass = "#33502e",
  moss = "#56703a",
  rock = "#6e716b",
  pad,
  shadows = false,
}: {
  size?: [number, number];
  depth?: number;
  height: HeightFn;
  segments?: number;
  grass?: string;
  moss?: string;
  rock?: string;
  /** Concrete / gravel pad area painted into vertex colours. */
  pad?: { x: number; z: number; r: number; color?: string };
  shadows?: boolean;
}) {
  const [W, D] = size;
  const { top, sides, sideMat, topMat } = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, D, segments, segments);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const cg = new THREE.Color(grass);
    const cm = new THREE.Color(moss);
    const cr = new THREE.Color(rock);
    const cp = new THREE.Color(pad?.color ?? "#8a8a82");
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = height(x, z);
      pos.setY(i, h);
      const n = fbm(x * 1.7, z * 1.7, 3);
      tmp.copy(cg).lerp(cm, n);
      tmp.lerp(cr, THREE.MathUtils.smoothstep(h, 0.45, 0.7) * 0.8);
      if (pad) {
        const d = Math.hypot(x - pad.x, z - pad.z);
        tmp.lerp(cp, 1 - THREE.MathUtils.smoothstep(d, pad.r * 0.85, pad.r));
      }
      colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();

    // Side skirts follow the terrain edge so the strata meet the surface exactly.
    const maxH = 1.2;
    const sideGeos: THREE.BufferGeometry[] = [];
    const edges: [number, number, number, number][] = [
      [-W / 2, D / 2, W / 2, D / 2],
      [W / 2, D / 2, W / 2, -D / 2],
      [W / 2, -D / 2, -W / 2, -D / 2],
      [-W / 2, -D / 2, -W / 2, D / 2],
    ];
    edges.forEach(([x0, z0, x1, z1], ei) => {
      const n = segments;
      const verts: number[] = [];
      const uvs: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = x0 + (x1 - x0) * t;
        const z = z0 + (z1 - z0) * t;
        const h = height(x, z);
        const edgeLen = Math.hypot(x1 - x0, z1 - z0);
        const u = (ei * 7.3 + t * edgeLen) / 2.6;
        verts.push(x, h, z, x, -depth, z);
        uvs.push(u, (h + depth) / (depth + maxH), u, 0);
        if (i < n) {
          const a = i * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      sg.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      sg.setIndex(idx);
      sg.computeVertexNormals();
      sideGeos.push(sg);
    });
    const tex = strataTexture();
    const sm = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 2.2, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
    const tm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, flatShading: false });
    return { top: g, sides: sideGeos, sideMat: sm, topMat: tm };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, D, depth, segments]);

  useLayoutEffect(() => () => {
    top.dispose();
    sides.forEach((s) => s.dispose());
    sideMat.dispose();
    topMat.dispose();
  }, [top, sides, sideMat, topMat]);

  return (
    <group>
      <mesh geometry={top} material={topMat} receiveShadow={shadows} />
      {sides.map((g, i) => (
        <mesh key={i} geometry={g} material={sideMat} />
      ))}
      <mesh position={[0, -depth, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#1e1f20" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Vegetation                                                          */
/* ------------------------------------------------------------------ */

export function Pines({
  count = 80,
  area,
  height,
  avoid = [],
  scale = 1,
  seed = 3,
  color = "#1f3a28",
}: {
  count?: number;
  area: [number, number];
  height: HeightFn;
  avoid?: { x: number; z: number; r: number }[];
  scale?: number;
  seed?: number;
  color?: string;
}) {
  const crowns = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const placements = useMemo(() => {
    const rnd = mulberry32(seed);
    const out: { x: number; y: number; z: number; s: number; r: number }[] = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 20) {
      const x = (rnd() - 0.5) * area[0];
      const z = (rnd() - 0.5) * area[1];
      if (avoid.some((a) => Math.hypot(x - a.x, z - a.z) < a.r)) continue;
      if (fbm(x * 0.6 + 10, z * 0.6, 2) < 0.42) continue; // clustered forest patches
      out.push({ x, z, y: height(x, z), s: (0.55 + rnd() * 0.7) * scale, r: rnd() * Math.PI });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const tint = new THREE.Color();
    placements.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r);
      m.compose(new THREE.Vector3(p.x, p.y + 0.32 * p.s, p.z), q, new THREE.Vector3(p.s, p.s, p.s));
      crowns.current?.setMatrixAt(i, m);
      crowns.current?.setColorAt(i, tint.set(color).multiplyScalar(0.8 + ((i * 37) % 10) / 25));
      m.compose(new THREE.Vector3(p.x, p.y + 0.05 * p.s, p.z), q, new THREE.Vector3(p.s, p.s, p.s));
      trunks.current?.setMatrixAt(i, m);
    });
    if (crowns.current) {
      crowns.current.instanceMatrix.needsUpdate = true;
      if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true;
    }
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
  }, [placements, color]);
  return (
    <group>
      <instancedMesh ref={crowns} args={[undefined, undefined, placements.length]} castShadow>
        <coneGeometry args={[0.12, 0.55, 7]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, placements.length]}>
        <cylinderGeometry args={[0.012, 0.018, 0.12, 5]} />
        <meshStandardMaterial color="#3b2a1d" roughness={1} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Industrial kit                                                      */
/* ------------------------------------------------------------------ */

const metal = { roughness: 0.42, metalness: 0.55 };

type V3 = [number, number, number];

export const Hall = forwardRef<THREE.Group, { position?: V3; size?: V3; color?: string; roof?: string; rotation?: number; emissive?: string; emissiveIntensity?: number }>(
  function Hall({ position = [0, 0, 0], size = [2, 1, 1.2], color = "#c9cbc4", roof = "#4b5350", rotation = 0, emissive = "#000000", emissiveIntensity = 0 }, ref) {
    const [w, h, d] = size;
    const roofGeo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-d / 2 - 0.04, 0);
      s.lineTo(0, h * 0.28);
      s.lineTo(d / 2 + 0.04, 0);
      s.lineTo(-d / 2 - 0.04, 0);
      const g = new THREE.ExtrudeGeometry(s, { depth: w + 0.08, bevelEnabled: false });
      g.translate(0, 0, -(w + 0.08) / 2);
      g.rotateY(Math.PI / 2);
      return g;
    }, [w, h, d]);
    return (
      <group ref={ref} position={position} rotation-y={rotation}>
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.25} emissive={emissive} emissiveIntensity={emissiveIntensity} />
        </mesh>
        <mesh geometry={roofGeo} position={[0, h, 0]} castShadow>
          <meshStandardMaterial color={roof} {...metal} />
        </mesh>
        {/* façade ribs */}
        {Array.from({ length: Math.max(2, Math.floor(w / 0.35)) }).map((_, i, arr) => (
          <mesh key={i} position={[-w / 2 + (w / (arr.length - 1)) * i, h / 2, d / 2 + 0.005]}>
            <boxGeometry args={[0.02, h, 0.01]} />
            <meshStandardMaterial color="#8d918c" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[w * 0.18, h * 0.32, d / 2 + 0.012]}>
          <boxGeometry args={[w * 0.22, h * 0.64, 0.01]} />
          <meshStandardMaterial color="#2a2f2e" roughness={0.6} metalness={0.3} />
        </mesh>
      </group>
    );
  },
);

export function Silo({ position = [0, 0, 0] as V3, r = 0.25, h = 1.2, color = "#d7d9d3" }) {
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, h, 24]} />
        <meshStandardMaterial color={color} {...metal} />
      </mesh>
      <mesh position={[0, h + r * 0.35, 0]} castShadow>
        <coneGeometry args={[r, r * 0.7, 24]} />
        <meshStandardMaterial color={color} {...metal} />
      </mesh>
      {[0.25, 0.5, 0.75].map((t) => (
        <mesh key={t} position={[0, h * t, 0]}>
          <torusGeometry args={[r + 0.004, 0.006, 4, 32]} />
          <meshStandardMaterial color="#8b8f8a" {...metal} />
        </mesh>
      ))}
    </group>
  );
}

export function Tank({ position = [0, 0, 0] as V3, r = 0.4, h = 0.35, color = "#5f6a68", water = true }) {
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, h, 32, 1, true]} />
        <meshStandardMaterial color={color} {...metal} side={THREE.DoubleSide} />
      </mesh>
      {water && (
        <mesh position={[0, h * 0.85, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[r * 0.98, 32]} />
          <meshStandardMaterial color="#3d6a6e" roughness={0.12} metalness={0.2} />
        </mesh>
      )}
    </group>
  );
}

/** Inclined belt conveyor between two points, with supports and a moving belt. */
export function Conveyor({ from, to, width = 0.14, speed = 0.4, color = "#3b4a46" }: { from: V3; to: V3; width?: number; speed?: number; color?: string }) {
  const tex = useMemo(() => {
    const t = beltTexture().clone();
    t.needsUpdate = true;
    return t;
  }, []);
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const dir = b.clone().sub(a).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
  useLayoutEffect(() => {
    tex.repeat.set(len * 3, 1);
  }, [tex, len]);
  useFrame((_, dt) => {
    tex.offset.x -= dt * speed * 3;
  });
  const legs = Math.max(1, Math.floor(len / 0.8));
  return (
    <group>
      <group position={mid} quaternion={quat}>
        <mesh castShadow>
          <boxGeometry args={[len, 0.05, width + 0.04]} />
          <meshStandardMaterial color={color} {...metal} />
        </mesh>
        <mesh position={[0, 0.028, 0]}>
          <boxGeometry args={[len, 0.008, width]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      </group>
      {Array.from({ length: legs }).map((_, i) => {
        const t = (i + 0.5) / legs;
        const p = a.clone().lerp(b, t);
        const ground = Math.min(from[1], to[1]) - (from[1] < to[1] ? 0 : 0);
        const base = Math.min(ground, 0);
        const hgt = p.y - base;
        if (hgt < 0.08) return null;
        return (
          <mesh key={i} position={[p.x, base + hgt / 2, p.z]}>
            <boxGeometry args={[0.03, hgt, 0.03]} />
            <meshStandardMaterial color="#59625f" {...metal} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Material stockpile — a noisy cone. */
export function Pile({ position = [0, 0, 0] as V3, r = 0.5, h = 0.4, color = "#a08b6c", seed = 1, grain = 0.35 }) {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(r, h, 40, 8, true);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const rnd = mulberry32(seed);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = (y + h / 2) / h;
      const n = (fbm(x * 4 + seed, z * 4, 3) - 0.5) * 0.18 * r * (1 - t) + (rnd() - 0.5) * 0.01;
      const k = 1 + n / Math.max(0.001, Math.hypot(x, z));
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
      pos.setY(i, y * (1 - 0.08 * Math.pow(1 - t, 3)));
    }
    g.computeVertexNormals();
    g.translate(0, h / 2, 0);
    return g;
  }, [r, h, seed]);
  const map = useMemo(() => {
    const c = new THREE.Color(color);
    const t = grainTexture([c.r * 255, c.g * 255, c.b * 255], `pile-${color}-${grain}`, grain).clone();
    t.repeat.set(6, 3);
    t.needsUpdate = true;
    return t;
  }, [color, grain]);
  return (
    <mesh geometry={geo} position={position} castShadow receiveShadow>
      <meshStandardMaterial map={map} roughness={0.98} metalness={0} />
    </mesh>
  );
}

/** Instanced rock mound — used for aggregate fraction samples. */
export function RockMound({
  count = 200,
  radius = 0.6,
  height = 0.5,
  size = [0.03, 0.06] as [number, number],
  colors = ["#8b8a85", "#a7a39a", "#6d6b66", "#bcb5a6"],
  seed = 4,
  position = [0, 0, 0] as V3,
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  useLayoutEffect(() => {
    const rnd = mulberry32(seed);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Stack in a cone: denser at the bottom.
      const t = Math.pow(rnd(), 0.6);
      const r = radius * Math.sqrt(rnd()) * (1 - t * 0.85);
      const a = rnd() * Math.PI * 2;
      const s = size[0] + rnd() * (size[1] - size[0]);
      const y = t * height + s * 0.6;
      e.set(rnd() * 6, rnd() * 6, rnd() * 6);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(s * (0.8 + rnd() * 0.5), s * (0.6 + rnd() * 0.4), s * (0.8 + rnd() * 0.5)));
      ref.current?.setMatrixAt(i, m);
      ref.current?.setColorAt(i, c.set(colors[Math.floor(rnd() * colors.length)]).multiplyScalar(0.85 + rnd() * 0.3));
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [count, radius, height, size, colors, seed]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} position={position} castShadow>
      <meshStandardMaterial roughness={0.85} metalness={0.02} flatShading />
    </instancedMesh>
  );
}

/** Hydraulic excavator with an animated dig cycle. `phase` drives the arm when provided. */
export function Excavator({ position = [0, 0, 0] as V3, rotation = 0, scale = 1, animate = true, color = "#e0a526" }) {
  const cab = useRef<THREE.Group>(null);
  const boom = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const bucket = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!animate) return;
    const t = clock.elapsedTime * 0.55;
    const s = Math.sin(t);
    if (cab.current) cab.current.rotation.y = Math.sin(t * 0.5) * 0.9;
    if (boom.current) boom.current.rotation.z = 0.55 + s * 0.22;
    if (arm.current) arm.current.rotation.z = -1.25 - s * 0.35;
    if (bucket.current) bucket.current.rotation.z = -0.6 + Math.cos(t) * 0.5;
  });
  const body = { color, roughness: 0.45, metalness: 0.3 };
  return (
    <group position={position} rotation-y={rotation} scale={scale}>
      {/* tracks */}
      {[-0.17, 0.17].map((z) => (
        <mesh key={z} position={[0, 0.06, z]} castShadow>
          <boxGeometry args={[0.62, 0.12, 0.12]} />
          <meshStandardMaterial color="#1d1f20" roughness={0.9} />
        </mesh>
      ))}
      <group ref={cab} position={[0, 0.14, 0]}>
        <mesh position={[-0.05, 0.1, 0]} castShadow>
          <boxGeometry args={[0.5, 0.16, 0.36]} />
          <meshStandardMaterial {...body} />
        </mesh>
        <mesh position={[0.07, 0.25, 0.09]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.16]} />
          <meshStandardMaterial color="#2b3a3c" roughness={0.1} metalness={0.6} />
        </mesh>
        <mesh position={[-0.24, 0.13, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.34]} />
          <meshStandardMaterial color="#2a2b2c" roughness={0.6} />
        </mesh>
        <group ref={boom} position={[0.14, 0.17, -0.06]}>
          <mesh position={[0.24, 0, 0]} castShadow>
            <boxGeometry args={[0.5, 0.06, 0.07]} />
            <meshStandardMaterial {...body} />
          </mesh>
          <group ref={arm} position={[0.48, 0, 0]}>
            <mesh position={[0.16, 0, 0]} castShadow>
              <boxGeometry args={[0.34, 0.045, 0.055]} />
              <meshStandardMaterial {...body} />
            </mesh>
            <group ref={bucket} position={[0.33, 0, 0]}>
              <mesh position={[0.05, -0.02, 0]} castShadow>
                <boxGeometry args={[0.1, 0.09, 0.13]} />
                <meshStandardMaterial color="#3a3b3c" roughness={0.5} metalness={0.6} />
              </mesh>
              <mesh position={[0.05, 0.02, 0]}>
                <boxGeometry args={[0.08, 0.03, 0.11]} />
                <meshStandardMaterial color="#4a3627" roughness={1} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Dump truck. `tilt` (0–1) raises the bed. */
export const Truck = forwardRef<THREE.Group, { position?: V3; rotation?: number; scale?: number; tilt?: number; load?: boolean; color?: string }>(function Truck(
  { position = [0, 0, 0], rotation = 0, scale = 1, tilt = 0, load = true, color = "#e7e9e4" },
  ref,
) {
  return (
    <group ref={ref} position={position} rotation-y={rotation} scale={scale}>
      <mesh position={[0, 0.11, 0]} castShadow>
        <boxGeometry args={[1.0, 0.07, 0.3]} />
        <meshStandardMaterial color="#25292a" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0.4, 0.26, 0]} castShadow>
        <boxGeometry args={[0.22, 0.26, 0.31]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0.5, 0.31, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.27]} />
        <meshStandardMaterial color="#1e2b2e" roughness={0.05} metalness={0.8} />
      </mesh>
      <mesh position={[0.46, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.31]} />
        <meshStandardMaterial color="#009a76" roughness={0.4} />
      </mesh>
      <group name="bed" position={[-0.5, 0.16, 0]} rotation-z={tilt * 0.75}>
        <mesh position={[0.36, 0.11, 0]} castShadow>
          <boxGeometry args={[0.72, 0.2, 0.32]} />
          <meshStandardMaterial color="#5a6460" roughness={0.5} metalness={0.5} />
        </mesh>
        {load && (
          <mesh name="load" position={[0.36, 0.22, 0]} scale={[1, 0.35, 0.8]}>
            <sphereGeometry args={[0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#4a3627" roughness={1} />
          </mesh>
        )}
      </group>
      {[0.38, -0.1, -0.32].map((x) =>
        [-0.15, 0.15].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.08, z]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
            <meshStandardMaterial color="#141516" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
});

export function Ship({ position = [0, 0, 0] as V3, rotation = 0, scale = 1 }) {
  const hull = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.2, 0.12);
    s.lineTo(1.0, 0.12);
    s.quadraticCurveTo(1.35, 0.12, 1.4, 0);
    s.lineTo(-1.2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
    g.translate(0, -0.12, -0.21);
    return g;
  }, []);
  return (
    <group position={position} rotation-y={rotation} scale={scale}>
      <mesh geometry={hull} castShadow>
        <meshStandardMaterial color="#21343a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[2.5, 0.05, 0.43]} />
        <meshStandardMaterial color="#9a3b2b" roughness={0.7} />
      </mesh>
      <mesh position={[-0.95, 0.23, 0]} castShadow>
        <boxGeometry args={[0.32, 0.28, 0.36]} />
        <meshStandardMaterial color="#e9ebe6" roughness={0.4} />
      </mesh>
      <mesh position={[-0.85, 0.3, 0]}>
        <boxGeometry args={[0.13, 0.06, 0.37]} />
        <meshStandardMaterial color="#1e2b2e" roughness={0.05} metalness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.16, 0]}>
        <boxGeometry args={[1.5, 0.12, 0.34]} />
        <meshStandardMaterial color="#3b4744" roughness={0.6} metalness={0.4} />
      </mesh>
      <Pile position={[0.15, 0.2, 0]} r={0.2} h={0.12} color="#a99a7f" seed={9} />
    </group>
  );
}

/** Calm fjord water with a subtle animated sheen. */
export function Water({ size = [20, 10] as [number, number], position = [0, -0.05, 0] as V3, color = "#0d2f36" }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(size[0], size[1], 64, 32).rotateX(-Math.PI / 2), [size]);
  const base = useMemo(() => Float32Array.from((geo.attributes.position as THREE.BufferAttribute).array), [geo]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      pos.setY(i, Math.sin(x * 1.3 + t * 0.8) * 0.012 + Math.cos(z * 1.7 + t * 0.6) * 0.01);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <mesh geometry={geo} position={position} receiveShadow>
      <meshStandardMaterial ref={mat} color={color} roughness={0.12} metalness={0.35} />
    </mesh>
  );
}

/** Cutaway wash drum with tumbling material. */
export function WashDrum({ position }: { position: [number, number, number] }) {
  const drum = useRef<THREE.Group>(null);
  const tumble = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const r = mulberry32(21);
    return Array.from({ length: 60 }, () => ({ a: r() * Math.PI * 2, x: (r() - 0.5) * 1.6, s: 0.03 + r() * 0.04, sp: 0.6 + r() }));
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ clock }) => {
    // Cutaway opening held toward the viewer (front/up); a slight rock keeps it alive.
    if (drum.current) drum.current.rotation.x = -0.9 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      const a = s.a + t * s.sp;
      // material rides up the wall and falls back — clamp to lower arc
      const ang = -Math.PI / 2 + Math.sin(a) * 0.9;
      const r = 0.36;
      m.makeScale(s.s, s.s, s.s).setPosition(s.x, Math.sin(ang) * r, Math.cos(ang) * r);
      tumble.current?.setMatrixAt(i, m);
    });
    if (tumble.current) tumble.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={position}>
      <group ref={drum} rotation-z={Math.PI / 2}>
        <mesh>
          <cylinderGeometry args={[0.45, 0.45, 1.9, 40, 1, true, 0.4, Math.PI * 1.45]} />
          <meshStandardMaterial color="#9ea6a3" metalness={0.7} roughness={0.32} side={THREE.DoubleSide} />
        </mesh>
        {[-0.95, -0.3, 0.3, 0.95].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.47, 0.025, 8, 40]} />
            <meshStandardMaterial color="#56605d" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
      </group>
      <instancedMesh ref={tumble} args={[undefined, undefined, seeds.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6b5a45" roughness={0.6} metalness={0.05} flatShading />
      </instancedMesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, -0.55, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.7]} />
          <meshStandardMaterial color="#38413f" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* spray bar */}
      <mesh position={[0, 0.7, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 2.1, 12]} />
        <meshStandardMaterial color="#c9ced0" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}
