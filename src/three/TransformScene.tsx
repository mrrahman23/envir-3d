"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { Quality } from "@/lib/quality";
import { tierScale } from "@/lib/quality";
import { mulberry32 } from "./noise";
import { Conveyor, DustField, Excavator, FlowLine, Hall, makeHeightFn, Pile, Pines, RockMound, StudioLights, Tank, Truck, WashDrum } from "./kit";

export const STAGE_X = [0, 14, 28, 42, 56];

// Look targets sit left of each station so the subject composes right of the copy.
const CAMS: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [-1.4, 2.7, 7.0], look: [-2.1, 0.55, 0] },
  { pos: [STAGE_X[1] - 0.4, 2.7, 7.0], look: [STAGE_X[1] - 1.9, 0.6, 0] },
  { pos: [STAGE_X[2] - 0.4, 3.1, 7.6], look: [STAGE_X[2] - 2.3, 0.7, 0.4] },
  { pos: [STAGE_X[3] + 0.2, 2.7, 7.3], look: [STAGE_X[3] - 1.7, 0.35, 0.3] },
  { pos: [STAGE_X[4] - 2.6, 4.2, 9.6], look: [STAGE_X[4] - 1.8, 0.3, -0.8] },
];

const DARK = new THREE.Color("#07181a");
const LIGHT = new THREE.Color("#dfe9e3");

function stageBlend(p: number) {
  const s = THREE.MathUtils.clamp(p, 0, 1) * (CAMS.length - 1);
  const i = Math.min(CAMS.length - 2, Math.floor(s));
  const f = THREE.MathUtils.smootherstep(s - i, 0.22, 0.78);
  return { i, f };
}

function Label({ position, children, tone = "dark" }: { position: [number, number, number]; children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <Html position={position} center distanceFactor={4.2} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
      <div
        aria-hidden
        className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide backdrop-blur ${
          tone === "dark" ? "border-white/20 bg-night/70 text-white/90" : "border-forest/20 bg-white/80 text-forest-950"
        }`}
      >
        {children}
      </div>
    </Html>
  );
}

/** Soil clods falling from the excavator bucket into the intake hopper. */
function FallingSoil({ from, to, count = 40 }: { from: THREE.Vector3; to: THREE.Vector3; count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const r = mulberry32(11);
    return Array.from({ length: count }, () => ({ o: r(), dx: (r() - 0.5) * 0.25, dz: (r() - 0.5) * 0.25, s: 0.02 + r() * 0.035 }));
  }, [count]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.5;
    seeds.forEach((s, i) => {
      const k = (t + s.o) % 1;
      v.lerpVectors(from, to, k);
      v.y = from.y + (to.y - from.y) * k * k + Math.sin(k * Math.PI) * 0.25;
      v.x += s.dx * k;
      v.z += s.dz * k;
      const sc = s.s * (k < 0.9 ? 1 : (1 - k) * 10);
      m.makeScale(sc, sc, sc).setPosition(v);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#4a3627" roughness={1} flatShading />
    </instancedMesh>
  );
}

/** Rocks travelling along a belt; big ones are diverted to the crusher. */
function BeltRocks({ start, end, count = 36 }: { start: THREE.Vector3; end: THREE.Vector3; count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => {
    const r = mulberry32(5);
    return Array.from({ length: count }, (_, i) => ({ o: i / count, big: r() < 0.25, s: 0.025 + r() * 0.03, rot: r() * 6, z: (r() - 0.5) * 0.08 }));
  }, [count]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const c = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.12;
    seeds.forEach((s, i) => {
      const k = (t + s.o) % 1;
      v.lerpVectors(start, end, Math.min(k / 0.8, 1));
      v.y += 0.05;
      v.z += s.z;
      if (k > 0.8) {
        // tumble off the screen deck: big rocks forward (crusher), fines drop through
        const f = (k - 0.8) / 0.2;
        if (s.big) {
          v.x += f * 0.7;
          v.y -= f * f * 0.5;
        } else {
          v.y -= f * 0.6;
        }
      }
      e.set(s.rot + k * 8, s.rot, 0);
      q.setFromEuler(e);
      const size = s.big ? s.s * 2.2 : s.s;
      sc.set(size, size * 0.8, size);
      m.compose(v, q, sc);
      ref.current?.setMatrixAt(i, m);
      ref.current?.setColorAt(i, c.set(s.big ? "#7c7871" : "#5a4532"));
    });
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.9} flatShading />
    </instancedMesh>
  );
}

function House({ position, s = 1, color = "#e8e4da" }: { position: [number, number, number]; s?: number; color?: string }) {
  return <Hall position={position} size={[0.6 * s, 0.38 * s, 0.45 * s]} color={color} roof="#3c3f3d" />;
}

export default function TransformScene({ progress, quality }: { progress: MutableRefObject<number>; quality: Quality }) {
  const k = tierScale(quality);
  const { camera, scene, size } = useThree();
  const smooth = useRef(progress.current);
  const look = useMemo(() => new THREE.Vector3(), []);
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);
  const bg = useMemo(() => new THREE.Color(), []);
  const fog = useMemo(() => new THREE.Fog("#07181a", 8, 24), []);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const truck = useRef<THREE.Group>(null);
  const recovery = useRef<THREE.Group>(null);
  const landHeight = useMemo(() => makeHeightFn({ amp: 0.35, scale: 0.25, flat: { x: 0, z: 0.6, r: 2.4, h: 0.05 } }), []);

  useFrame(({ clock }, dt) => {
    smooth.current = THREE.MathUtils.damp(smooth.current, progress.current, 4, dt);
    const p = smooth.current;
    const { i, f } = stageBlend(p);
    tmpA.set(...CAMS[i].pos).lerp(tmpB.set(...CAMS[i + 1].pos), f);
    // arc upward between stations for a crane-like travel
    tmpA.y += Math.sin(f * Math.PI) * 1.2;
    tmpA.z += Math.sin(f * Math.PI) * 1.5;
    look.set(...CAMS[i].look).lerp(tmpB.set(...CAMS[i + 1].look), f);
    // Portrait: centre the subject in the upper half, copy sits below.
    if (size.width / size.height < 1) {
      tmpA.sub(look);
      look.x += 2.1;
      look.y -= 0.9;
      tmpA.multiplyScalar(1.35).add(look);
      tmpA.x += 2.1 * 0.35;
    }
    const t = clock.elapsedTime;
    tmpA.x += Math.sin(t * 0.2) * 0.12;
    tmpA.y += Math.cos(t * 0.17) * 0.06;
    camera.position.copy(tmpA);
    camera.lookAt(look);

    // Brighten into the final "new life" stage.
    const light = THREE.MathUtils.smoothstep(p, 0.74, 0.97);
    bg.copy(DARK).lerp(LIGHT, light);
    scene.background = bg;
    fog.color.copy(bg);
    fog.near = 8 + light * 6;
    fog.far = 24 + light * 20;
    scene.fog = fog;
    if (hemi.current) hemi.current.intensity = 0.4 + light * 1.4;
    if (sun.current) sun.current.intensity = 0.6 + light * 2.4;

    if (truck.current) {
      const c = (t * 0.08) % 1;
      truck.current.position.x = -6 + Math.min(c / 0.45, 1) * 3.7;
    }
    if (recovery.current) recovery.current.rotation.y = Math.sin(t * 0.15) * 0.25;
  });

  const hopperFrom = useMemo(() => new THREE.Vector3(-0.15, 1.05, 0.1), []);
  const hopperTo = useMemo(() => new THREE.Vector3(1.05, 0.95, 0), []);
  const beltStart = useMemo(() => new THREE.Vector3(STAGE_X[1] - 3.2, 0.25, 0), []);
  const beltEnd = useMemo(() => new THREE.Vector3(STAGE_X[1] + 0.1, 1.05, 0), []);

  const fractions = [
    { label: "0–2 mm", kind: "sand" as const, color: "#ada18b" },
    { label: "2–8 mm", size: [0.012, 0.022] as [number, number], n: 900, colors: ["#a59c8c", "#8f877a", "#c1b8a6"] },
    { label: "8–16 mm", size: [0.022, 0.04] as [number, number], n: 520, colors: ["#8d8b85", "#a9a59c", "#6f6d68"] },
    { label: "16–32 mm", size: [0.04, 0.07] as [number, number], n: 260, colors: ["#8b8a85", "#a7a39a", "#6d6b66"] },
    { label: "32–64 mm", size: [0.07, 0.12] as [number, number], n: 110, colors: ["#7f7d77", "#9d9a92", "#64625d"] },
  ];

  return (
    <>
      <StudioLights env={quality !== "low"} intensity={0.75} envIntensity={0.5} shadows={false} />
      <hemisphereLight ref={hemi} args={["#e8f4ef", "#4a5a40", 0.4]} />
      <directionalLight ref={sun} position={[STAGE_X[4] + 6, 12, 8]} intensity={0.6} color="#fff1db" />

      {/* Industrial floor through stages 1–4 */}
      <mesh rotation-x={-Math.PI / 2} position={[22, 0, 0]} receiveShadow>
        <planeGeometry args={[54, 18]} />
        <meshStandardMaterial color="#2a2f2d" roughness={0.95} />
      </mesh>

      {/* ── Stage 1: Arrival ─────────────────────────────── */}
      <group position={[STAGE_X[0], 0, 0]}>
        <Pile position={[-1.9, 0, -0.7]} r={1.1} h={0.75} color="#4b3828" seed={4} />
        <Pile position={[-2.8, 0, 0.4]} r={0.7} h={0.45} color="#5a4431" seed={8} />
        <Excavator position={[-0.9, 0, -0.05]} rotation={0} scale={1.6} />
        {/* intake hopper */}
        <group position={[1.1, 0, 0]}>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.55, 0.22, 0.45, 4, 1, true]} />
            <meshStandardMaterial color="#d7a32a" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          {[-0.3, 0.3].map((x) =>
            [-0.3, 0.3].map((z) => (
              <mesh key={`${x}${z}`} position={[x, 0.32, z]}>
                <boxGeometry args={[0.05, 0.64, 0.05]} />
                <meshStandardMaterial color="#3e4644" metalness={0.6} roughness={0.4} />
              </mesh>
            )),
          )}
        </group>
        <FallingSoil from={hopperFrom} to={hopperTo} count={Math.round(50 * k) + 10} />
        <Truck ref={truck} position={[-6, 0, 1.4]} scale={1.4} />
        <Label position={[1.1, 1.35, 0]}>Mottak · skitten sone</Label>
        <DustField count={Math.round(300 * k)} bounds={[6, 3, 4]} position={[0, 1.4, 0]} size={[0.4, 1.4]} />
      </group>

      {/* ── Stage 2: Separation ──────────────────────────── */}
      <group>
        <Conveyor from={[beltStart.x, beltStart.y, 0]} to={[beltEnd.x, beltEnd.y, 0]} width={0.22} speed={0.45} />
        <BeltRocks start={beltStart} end={beltEnd} count={Math.round(50 * k) + 12} />
        {/* vibrating screen deck */}
        <group position={[STAGE_X[1] + 0.6, 0.85, 0]} rotation-z={-0.18}>
          <mesh>
            <boxGeometry args={[1.2, 0.05, 0.6]} />
            <meshStandardMaterial color="#5f6b68" metalness={0.65} roughness={0.35} wireframe={false} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[1.15, 0.01, 0.56]} />
            <meshStandardMaterial color="#9aa29f" metalness={0.8} roughness={0.3} wireframe />
          </mesh>
        </group>
        {/* crusher */}
        <group position={[STAGE_X[1] + 1.7, 0, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.7, 0.8, 0.7]} />
            <meshStandardMaterial color="#c58f24" metalness={0.45} roughness={0.45} />
          </mesh>
          <Pile position={[0.75, 0, 0]} r={0.4} h={0.3} color="#827d75" seed={6} />
        </group>
        <Pile position={[STAGE_X[1] + 0.6, 0, 0.1]} r={0.5} h={0.32} color="#5a4532" seed={12} />
        <Label position={[STAGE_X[1] + 1.7, 1.05, 0]}>{"> 90 mm knuses"}</Label>
        <Label position={[STAGE_X[1] - 1.4, 0.95, 0]}>Sortering</Label>
      </group>

      {/* ── Stage 3: Purification ────────────────────────── */}
      <group position={[STAGE_X[2], 0, 0]}>
        <WashDrum position={[0, 1.0, 0]} />
        <Pile position={[-2.0, 0, 0.3]} r={0.65} h={0.5} color="#47352a" seed={14} />
        <Pile position={[2.0, 0, 0.3]} r={0.65} h={0.5} color="#cdb48a" seed={15} grain={0.2} />
        {/* water in, sludge out, clean water recirculates */}
        <FlowLine points={[[-1.0, 1.7, 0.05], [0, 1.78, 0.05], [1.0, 1.7, 0.05]]} color="#96d7e8" radius={0.02} speed={0.5} density={6} />
        {[-0.6, -0.2, 0.2, 0.6].map((x) => (
          <FlowLine key={x} points={[[x, 1.68, 0], [x, 1.3, 0.05], [x, 1.1, 0.02]]} color="#96d7e8" radius={0.008} speed={0.9} density={3} />
        ))}
        <FlowLine points={[[0.6, 0.45, 0.2], [1.0, 0.25, 0.9], [1.6, 0.12, 1.4]]} color="#7a5a3c" radius={0.03} speed={0.3} density={3} />
        <FlowLine points={[[1.6, 0.25, 1.4], [0.2, 0.4, 2.0], [-1.6, 0.6, 1.4], [-1.2, 1.6, 0.4], [-1.0, 1.7, 0.05]]} color="#5cc6a4" radius={0.014} speed={0.35} density={5} opacity={0.8} />
        {/* filter press */}
        <group position={[1.9, 0, 1.6]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.9, 0.5, 0.45]} />
            <meshStandardMaterial color="#5f6766" metalness={0.6} roughness={0.4} />
          </mesh>
          {Array.from({ length: 8 }).map((_, j) => (
            <mesh key={j} position={[-0.35 + j * 0.1, 0.27, 0.235]}>
              <boxGeometry args={[0.06, 0.42, 0.01]} />
              <meshStandardMaterial color="#9aa09d" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </group>
        <Tank position={[-1.7, 0, 1.6]} r={0.4} h={0.3} />
        <Label position={[-2.0, 0.85, 0.3]}>Inn: forurenset</Label>
        <Label position={[2.0, 0.85, 0.3]}>Ut: vasket sand</Label>
        <Label position={[1.9, 0.8, 1.6]}>Filterkake → deponi</Label>
        <Label position={[-1.7, 0.65, 1.6]}>Prosessvann tilbake</Label>
      </group>

      {/* ── Stage 4: Recovery ────────────────────────────── */}
      <group ref={recovery} position={[STAGE_X[3], 0, 0]}>
        {fractions.map((fr, j) => {
          const a = (j - 2) * 0.55;
          const x = Math.sin(a) * 2.2;
          const z = -Math.cos(a) * 2.2 + 1.6;
          return (
            <group key={fr.label} position={[x, 0, z]}>
              <mesh position={[0, 0.07, 0]}>
                <cylinderGeometry args={[0.42, 0.45, 0.14, 40]} />
                <meshStandardMaterial color="#1c2422" metalness={0.4} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.142, 0]} rotation-x={-Math.PI / 2}>
                <ringGeometry args={[0.4, 0.43, 48]} />
                <meshBasicMaterial color="#b9d95a" />
              </mesh>
              {fr.kind === "sand" ? (
                <Pile position={[0, 0.14, 0]} r={0.36} h={0.28} color={fr.color} seed={30} grain={0.18} />
              ) : (
                <RockMound position={[0, 0.14, 0]} count={Math.round(fr.n! * (0.4 + 0.6 * k))} radius={0.36} height={0.25} size={fr.size} colors={fr.colors} seed={j + 2} />
              )}
              <Label position={[0, 0.65, 0]}>{fr.label}</Label>
            </group>
          );
        })}
        <spotLight position={[0, 4, 3]} angle={0.7} penumbra={0.8} intensity={30} color="#fff4e0" distance={12} />
      </group>

      {/* ── Stage 5: New life ────────────────────────────── */}
      <group position={[STAGE_X[4], 0, 0]}>
        <mesh rotation-x={-Math.PI / 2} position={[1, 0.0, 0]}>
          <planeGeometry args={[16, 28]} />
          <meshStandardMaterial color="#6d8a52" roughness={1} />
        </mesh>
        {/* road */}
        <mesh rotation-x={-Math.PI / 2} rotation-z={0.25} position={[0, 0.01, 0.6]}>
          <planeGeometry args={[16, 0.9]} />
          <meshStandardMaterial color="#3a3d3c" roughness={0.85} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} rotation-z={0.25} position={[0, 0.015, 0.6]}>
          <planeGeometry args={[16, 0.03]} />
          <meshStandardMaterial color="#e9e6d6" roughness={0.6} />
        </mesh>
        <House position={[1.6, 0, -1.4]} s={1.6} />
        <House position={[2.8, 0, -0.9]} s={1.3} color="#c9533f" />
        <House position={[3.6, 0, -2.0]} s={1.5} color="#e2d7b9" />
        <House position={[-0.6, 0, -2.4]} s={1.2} color="#f1efe8" />
        <Pile position={[-1.6, 0, 1.6]} r={0.5} h={0.3} color="#9d978c" seed={41} />
        <Excavator position={[-2.5, 0, 1.4]} rotation={0.6} scale={1.1} animate />
        <Pines count={Math.round(110 * k) + 20} area={[14, 8]} height={() => 0} avoid={[{ x: 0, z: 0.6, r: 1.2 }, { x: 2.2, z: -1.4, r: 2 }, { x: -2, z: 1.5, r: 1.2 }]} scale={1.05} seed={9} color="#2f5634" />
        <group position={[0, 0, -4]}>
          <Pines count={Math.round(90 * k) + 20} area={[16, 3]} height={landHeight} scale={1.4} seed={12} color="#28472d" />
        </group>
        <Label position={[-1.6, 0.75, 1.6]} tone="light">
          Gjenvunne masser i nytt prosjekt
        </Label>
      </group>
    </>
  );
}
