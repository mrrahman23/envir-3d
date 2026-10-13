"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Quality } from "@/lib/quality";
import { tierScale } from "@/lib/quality";
import { mulberry32 } from "./noise";
import { DustField, FlowLine, Pile, RockMound, StudioLights, Tank, Truck, WashDrum } from "./kit";

type P = { quality: Quality; reducedMotion: boolean };

/** Dark hall interior shared by the industrial vignettes. */
function HallInterior({ lights = 5 }: { lights?: number }) {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#2b2f2d" roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[0, 4, -5]}>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color="#1a2020" roughness={0.9} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} position={[-13 + i * 2, 3.5, -4.95]}>
          <boxGeometry args={[0.12, 7, 0.1]} />
          <meshStandardMaterial color="#2a3231" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: lights }).map((_, i) => (
        <group key={i} position={[-6 + i * 3, 5.2, -1.5]}>
          <mesh>
            <boxGeometry args={[0.6, 0.05, 0.25]} />
            <meshBasicMaterial color="#fff6e5" />
          </mesh>
          <pointLight intensity={6} distance={9} color="#ffeeda" position={[0, -0.3, 0]} />
        </group>
      ))}
    </>
  );
}

/* A — Massemottak: a truck arrives and tips its load. */
export function ReceptionScene({ quality, reducedMotion }: P) {
  const k = tierScale(quality);
  const truck = useRef<THREE.Group>(null);
  const clods = useRef<THREE.InstancedMesh>(null);
  const pile = useRef<THREE.Mesh>(null);
  const seeds = useMemo(() => {
    const r = mulberry32(3);
    return Array.from({ length: 70 }, () => ({ o: r(), x: (r() - 0.5) * 0.5, z: (r() - 0.5) * 0.4, s: 0.03 + r() * 0.05 }));
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame(({ camera, clock }) => {
    const t = reducedMotion ? 4.2 : clock.elapsedTime % 10;
    // 0–3.2 drive in, 3.2–4.2 tip, 4.2–6.5 dump, 6.5–7.5 lower, 7.5–10 drive out
    let x: number;
    let tilt = 0;
    if (t < 3.2) x = -7 + (1 - Math.pow(1 - t / 3.2, 3)) * 7;
    else if (t < 7.5) x = 0;
    else x = Math.pow((t - 7.5) / 2.5, 2) * 8;
    if (t >= 3.2 && t < 4.2) tilt = (t - 3.2) / 1;
    else if (t >= 4.2 && t < 6.5) tilt = 1;
    else if (t >= 6.5 && t < 7.5) tilt = 1 - (t - 6.5);
    if (truck.current) {
      truck.current.position.x = x;
      const bedGroup = truck.current.getObjectByName("bed");
      if (bedGroup) bedGroup.rotation.z = tilt * 0.75;
      const load = truck.current.getObjectByName("load");
      if (load) load.visible = t < 4.6 || t > 9.9;
    }
    const dumping = t > 4.0 && t < 6.6;
    seeds.forEach((s, i) => {
      const kk = ((t - 4.0) * 0.55 + s.o) % 1;
      const visible = dumping && kk < 0.95;
      const y = 0.75 - kk * kk * 0.8;
      const sc = visible ? s.s : 0.0001;
      m.makeScale(sc, sc, sc).setPosition(-0.95 - kk * 0.6 + s.x * 0.5, Math.max(0.03, y), s.z);
      clods.current?.setMatrixAt(i, m);
    });
    if (clods.current) clods.current.instanceMatrix.needsUpdate = true;
    if (pile.current) {
      const g = THREE.MathUtils.clamp((t - 4.2) / 3, 0, 1);
      pile.current.scale.set(0.5 + g * 0.5, 0.2 + g * 0.8, 0.5 + g * 0.5);
    }
    if (!reducedMotion) {
      camera.position.x = -2.6 + Math.sin(clock.elapsedTime * 0.12) * 0.6;
      camera.lookAt(-0.6, 0.45, 0);
    }
  });
  return (
    <>
      <fog attach="fog" args={["#07181a", 6, 18]} />
      <StudioLights env={quality !== "low"} intensity={0.55} envIntensity={0.4} />
      <HallInterior />
      <Truck ref={truck} position={[-7, 0, 0]} scale={1.7} />
      <instancedMesh ref={clods} args={[undefined, undefined, seeds.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#4a3627" roughness={1} flatShading />
      </instancedMesh>
      <group position={[-1.7, 0, 0]}>
        <group ref={pile}>
          <Pile r={0.9} h={0.6} color="#4a3627" seed={3} />
        </group>
      </group>
      <Pile position={[-4.4, 0, -1.6]} r={1.6} h={1.1} color="#3f2f23" seed={5} />
      <Pile position={[2.8, 0, -2]} r={1.3} h={0.9} color="#55412f" seed={7} />
      <DustField count={Math.round(400 * k)} bounds={[10, 4, 5]} position={[0, 2, -0.5]} size={[0.5, 1.5]} rise={0.04} />
    </>
  );
}

/* B — Salg: a rotating carousel of recovered fractions. */
const SAMPLES = [
  { id: "0-2", sand: true, color: "#ada18b" },
  { id: "2-8", size: [0.014, 0.026], n: 900, colors: ["#a59c8c", "#8f877a", "#c1b8a6"] },
  { id: "8-16", size: [0.026, 0.045], n: 520, colors: ["#8d8b85", "#a9a59c", "#6f6d68"] },
  { id: "16-32", size: [0.045, 0.075], n: 260, colors: ["#8b8a85", "#a7a39a", "#6d6b66"] },
  { id: "32-64", size: [0.075, 0.12], n: 120, colors: ["#7f7d77", "#9d9a92", "#64625d"] },
  { id: "64-90", size: [0.12, 0.17], n: 55, colors: ["#77756f", "#93908a", "#5f5d59"] },
] as const;

export const SAMPLE_IDS = SAMPLES.map((s) => s.id);

export function MaterialsScene({ quality, reducedMotion, selected }: P & { selected: number }) {
  const k = tierScale(quality);
  const group = useRef<THREE.Group>(null);
  const R = 2.3;
  useFrame((_, dt) => {
    if (!group.current) return;
    const target = -(selected / SAMPLES.length) * Math.PI * 2;
    const g = group.current;
    // shortest path rotation
    let diff = target - g.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += reducedMotion ? diff : diff * (1 - Math.exp(-dt * 3));
    g.children.forEach((c, i) => {
      const inner = c.children[2];
      if (inner && !reducedMotion) inner.rotation.y += dt * (i === selected ? 0.35 : 0.1);
    });
  });
  return (
    <>
      <StudioLights env={quality !== "low"} intensity={0.7} envIntensity={0.6} />
      <spotLight position={[0, 5, 4.5]} angle={0.42} penumbra={0.75} intensity={60} color="#fff3e2" distance={14} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#141a19" roughness={0.4} metalness={0.3} />
      </mesh>
      <group ref={group} position={[0, 0, -R + 0.9]}>
        {SAMPLES.map((s, i) => {
          const a = (i / SAMPLES.length) * Math.PI * 2;
          return (
            <group key={s.id} position={[Math.sin(a) * R, 0, Math.cos(a) * R]}>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.55, 0.6, 0.24, 48]} />
                <meshStandardMaterial color="#1f2826" metalness={0.5} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.242, 0]} rotation-x={-Math.PI / 2}>
                <ringGeometry args={[0.52, 0.55, 64]} />
                <meshBasicMaterial color={i === selected ? "#b9d95a" : "#3d4a46"} />
              </mesh>
              <group position={[0, 0.24, 0]}>
                {"sand" in s ? (
                  <Pile r={0.48} h={0.36} color={s.color} seed={40} grain={0.16} />
                ) : (
                  <RockMound count={Math.round(s.n * (0.35 + 0.65 * k))} radius={0.46} height={0.32} size={s.size as unknown as [number, number]} colors={[...s.colors]} seed={i + 7} />
                )}
              </group>
            </group>
          );
        })}
      </group>
    </>
  );
}

/* C — Jordbehandling: cutaway wash process. */
export function WashScene({ quality, reducedMotion }: P) {
  const k = tierScale(quality);
  useFrame(({ camera, clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime * 0.1;
    camera.position.set(Math.sin(t) * 1.2, 2.1 + Math.sin(t * 0.7) * 0.15, 4.6);
    camera.lookAt(0, 0.7, 0);
  });
  return (
    <>
      <fog attach="fog" args={["#07181a", 6, 16]} />
      <StudioLights env={quality !== "low"} intensity={0.7} envIntensity={0.55} />
      <HallInterior lights={4} />
      <WashDrum position={[0, 1.05, 0]} />
      <FlowLine points={[[-1.0, 1.75, 0.05], [0, 1.82, 0.05], [1.0, 1.75, 0.05]]} color="#96d7e8" radius={0.022} speed={0.5} density={6} />
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
        <FlowLine key={x} points={[[x, 1.72, 0], [x, 1.35, 0.05], [x, 1.12, 0.02]]} color="#96d7e8" radius={0.008} speed={1} density={3} />
      ))}
      <FlowLine points={[[0.6, 0.48, 0.2], [1.1, 0.25, 0.8], [1.7, 0.12, 1.2]]} color="#7a5a3c" radius={0.035} speed={0.3} density={3} />
      <FlowLine points={[[1.7, 0.25, 1.2], [0.2, 0.4, 1.8], [-1.6, 0.6, 1.2], [-1.2, 1.7, 0.4], [-1.0, 1.75, 0.05]]} color="#5cc6a4" radius={0.015} speed={0.35} density={5} opacity={0.8} />
      <Pile position={[-2.1, 0, 0.2]} r={0.7} h={0.55} color="#47352a" seed={14} />
      <Pile position={[2.1, 0, 0.0]} r={0.7} h={0.55} color="#cdb48a" seed={15} grain={0.2} />
      <Tank position={[1.9, 0, 1.3]} r={0.35} h={0.3} color="#4f4a43" />
      <Html position={[-2.1, 0.95, 0.2]} center distanceFactor={3.6} style={{ pointerEvents: "none" }}>
        <span aria-hidden className="whitespace-nowrap rounded-full border border-white/20 bg-night/70 px-3 py-1 text-[11px] text-white/90 backdrop-blur">Inn</span>
      </Html>
      <Html position={[2.1, 0.95, 0]} center distanceFactor={3.6} style={{ pointerEvents: "none" }}>
        <span aria-hidden className="whitespace-nowrap rounded-full border border-white/20 bg-night/70 px-3 py-1 text-[11px] text-white/90 backdrop-blur">Ut: vasket sand</span>
      </Html>
      <Html position={[1.9, 0.65, 1.3]} center distanceFactor={3.6} style={{ pointerEvents: "none" }}>
        <span aria-hidden className="whitespace-nowrap rounded-full border border-white/20 bg-night/70 px-3 py-1 text-[11px] text-white/90 backdrop-blur">Slam → filterpresse</span>
      </Html>
      <DustField count={Math.round(220 * k)} bounds={[6, 3, 3]} position={[0, 1.5, 0]} palette={["#b8dbe6", "#96d7e8", "#e6f2f5", "#ffffff"]} size={[0.4, 1.2]} rise={-0.02} opacity={0.6} glint={0} />
    </>
  );
}

/* D — Laboratorium: a soil sample under clean lab light. */
export function LabScene({ quality, reducedMotion }: P) {
  const physical = quality === "high" || quality === "medium";
  const glass = useMemo(
    () =>
      physical
        ? new THREE.MeshPhysicalMaterial({ color: "#ffffff", transmission: 1, roughness: 0.04, thickness: 0.05, ior: 1.45, transparent: true })
        : new THREE.MeshStandardMaterial({ color: "#e8f2f4", transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1 }),
    [physical],
  );
  useFrame(({ camera, clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    const push = 0.5 + 0.5 * Math.sin(t * 0.18);
    camera.position.set(Math.sin(t * 0.15) * 0.4, 1.35 + push * 0.1, 3.9 - push * 0.45);
    camera.lookAt(0, 0.55, 0);
  });
  const tubes = [-0.3, -0.1, 0.1, 0.3];
  return (
    <>
      <ambientLight intensity={0.5} />
      <StudioLights env={quality !== "low"} intensity={0.9} envIntensity={1.1} warm="#ffffff" cool="#cfe8ff" />
      <spotLight position={[0.4, 3, 1.6]} angle={0.5} penumbra={0.9} intensity={28} color="#ffffff" distance={8} />
      {/* bench */}
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[6, 0.4, 2.4]} />
        <meshStandardMaterial color="#f3f4f1" roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.6, -1.2]}>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#e6e9e6" roughness={0.9} />
      </mesh>
      {/* tube rack */}
      <group position={[0, 0.4, 0]}>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.9, 0.02, 0.22]} />
          <meshStandardMaterial color="#cfd5d6" metalness={0.6} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.9, 0.02, 0.22]} />
          <meshStandardMaterial color="#cfd5d6" metalness={0.6} roughness={0.25} />
        </mesh>
        {tubes.map((x, i) => (
          <group key={x} position={[x, 0.24, 0]}>
            <mesh material={glass}>
              <cylinderGeometry args={[0.055, 0.055, 0.62, 28, 1, true]} />
            </mesh>
            <mesh position={[0, -0.31, 0]} material={glass}>
              <sphereGeometry args={[0.055, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            </mesh>
            {i === 0 && (
              <mesh position={[0, -0.12, 0]}>
                <cylinderGeometry args={[0.048, 0.048, 0.4, 24]} />
                <meshStandardMaterial color="#4a3627" roughness={1} />
              </mesh>
            )}
            {i === 1 && (
              <mesh position={[0, -0.18, 0]}>
                <cylinderGeometry args={[0.048, 0.048, 0.26, 24]} />
                <meshStandardMaterial color="#9c8667" roughness={0.6} transparent opacity={0.85} />
              </mesh>
            )}
          </group>
        ))}
      </group>
      {/* sieve stack — grain size analysis */}
      <group position={[-0.95, 0.4, -0.25]}>
        {[0, 1, 2, 3].map((j) => (
          <mesh key={j} position={[0, 0.07 + j * 0.13, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.12, 40]} />
            <meshStandardMaterial color="#dfe3e3" metalness={0.35} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {/* wash bottle + sample jars */}
      <group position={[0.85, 0.4, -0.2]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.4, 28]} />
          <meshStandardMaterial color="#f7f7f5" roughness={0.4} transparent opacity={0.95} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.1, 20]} />
          <meshStandardMaterial color="#2a6fb2" roughness={0.4} />
        </mesh>
      </group>
      {[1.2, 1.5].map((x, i) => (
        <group key={x} position={[x, 0.4, 0.3]}>
          <mesh position={[0, 0.12, 0]} material={glass}>
            <cylinderGeometry args={[0.12, 0.12, 0.24, 28]} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.105, 0.105, 0.13, 24]} />
            <meshStandardMaterial color={i ? "#c2a77d" : "#5a4431"} roughness={1} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.125, 0.125, 0.04, 24]} />
            <meshStandardMaterial color="#00a37e" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}
