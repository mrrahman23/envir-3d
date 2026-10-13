"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { FacilityZoneId } from "@/content/site";
import type { Quality } from "@/lib/quality";
import { tierScale } from "@/lib/quality";
import { Conveyor, DustField, Hall, Pile, Pines, Ship, Silo, StudioLights, Tank, Truck, Water } from "./kit";

type V3 = [number, number, number];

export const ZONE_POS: Record<FacilityZoneId, V3> = {
  mottak: [-4.3, 0, 0.3],
  vask: [-0.4, 0, -0.6],
  damp: [-3.9, 0, -2.2],
  lager: [3.6, 0, -0.2],
  lab: [2.9, 0, -2.6],
  kai: [1.6, 0, 2.7],
};

const ZONE_RADIUS: Record<FacilityZoneId, number> = { mottak: 1.3, vask: 2.6, damp: 0.9, lager: 1.4, lab: 0.9, kai: 2.2 };

function Zone({
  id,
  active,
  hovered,
  onHover,
  onSelect,
  index,
  children,
}: {
  id: FacilityZoneId;
  active: boolean;
  hovered: boolean;
  onHover: (id: FacilityZoneId | null) => void;
  onSelect: (id: FacilityZoneId) => void;
  index: number;
  children: ReactNode;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const r = ZONE_RADIUS[id];
  useFrame(({ clock }) => {
    const m = ring.current?.material as THREE.MeshBasicMaterial | undefined;
    if (!m || !ring.current) return;
    const target = active ? 0.85 : hovered ? 0.5 : 0;
    m.opacity = THREE.MathUtils.lerp(m.opacity, target * (0.8 + Math.sin(clock.elapsedTime * 3) * 0.2), 0.12);
    ring.current.visible = m.opacity > 0.01;
  });
  const pos = ZONE_POS[id];
  return (
    <group
      position={pos}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {children}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} visible={false}>
        <ringGeometry args={[r * 0.92, r, 64]} />
        <meshBasicMaterial color="#b9d95a" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* invisible hit area so the whole zone is easy to target */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[r, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, id === "vask" ? 2.1 : 1.35, 0]} center zIndexRange={[20, 0]}>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => onSelect(id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shadow-lg transition-all duration-300 ${
            active ? "scale-110 border-lime bg-lime text-forest-950" : "border-white/40 bg-night/75 text-white backdrop-blur hover:border-lime"
          }`}
        >
          {index + 1}
        </button>
      </Html>
    </group>
  );
}

function Steam({ position, count }: { position: V3; count: number }) {
  return <DustField count={count} bounds={[0.5, 2.2, 0.5]} position={position} palette={["#e9eef0", "#ffffff", "#cfd8db", "#ffffff"]} size={[2, 5]} rise={0.25} opacity={0.35} glint={0} />;
}

export default function FacilityScene({
  quality,
  reducedMotion,
  active,
  onSelect,
  controls,
}: {
  quality: Quality;
  reducedMotion: boolean;
  active: FacilityZoneId | null;
  onSelect: (id: FacilityZoneId) => void;
  controls: boolean;
}) {
  const k = tierScale(quality);
  const [hovered, setHovered] = useState<FacilityZoneId | null>(null);
  const orbit = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const ids = Object.keys(ZONE_POS) as FacilityZoneId[];

  useFrame((_, dt) => {
    const goal = active ? ZONE_POS[active] : ([0, 0, 0] as V3);
    desired.set(goal[0] * 0.6, 0, goal[2] * 0.6);
    if (reducedMotion) target.copy(desired);
    else target.lerp(desired, 1 - Math.exp(-dt * 2.5));
    if (orbit.current) {
      orbit.current.target.copy(target);
      orbit.current.update();
    } else {
      camera.lookAt(target);
    }
  });

  const landHeight = () => 0;
  const zoneProps = (id: FacilityZoneId) => ({
    id,
    index: ids.indexOf(id),
    active: active === id,
    hovered: hovered === id,
    onHover: setHovered,
    onSelect,
  });

  return (
    <>
      <fog attach="fog" args={["#0b2622", 16, 34]} />
      <StudioLights env={quality !== "low"} intensity={0.95} shadows={quality === "high"} envIntensity={0.6} />

      {/* Land + fjord */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -1.2]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#4a514c" roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -0.8]}>
        <planeGeometry args={[11.5, 5.6]} />
        <meshStandardMaterial color="#6c706a" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, -4.4]}>
        <planeGeometry args={[16, 2.2]} />
        <meshStandardMaterial color="#344a33" roughness={1} />
      </mesh>
      <group position={[0, 0, -4.4]}>
        <Pines count={Math.round(70 * k) + 20} area={[15, 1.8]} height={landHeight} scale={2.2} seed={6} />
      </group>
      <Water size={[22, 9]} position={[0, -0.08, 7.1]} />
      {/* quay edge */}
      <mesh position={[0, -0.04, 2.8]}>
        <boxGeometry args={[16, 0.16, 0.2]} />
        <meshStandardMaterial color="#8f918b" roughness={0.8} />
      </mesh>

      {/* 1 · Massemottak */}
      <Zone {...zoneProps("mottak")}>
        <mesh position={[0.4, 0.02, 0.7]}>
          <boxGeometry args={[1.3, 0.04, 0.5]} />
          <meshStandardMaterial color="#383c3b" metalness={0.5} roughness={0.5} />
        </mesh>
        <Truck position={[0.3, 0.04, 0.7]} rotation={0} scale={1.1} />
        <Pile position={[-0.4, 0, -0.4]} r={0.75} h={0.5} color="#4a3627" seed={21} />
        <Pile position={[0.55, 0, -0.5]} r={0.5} h={0.35} color="#5a4431" seed={22} />
      </Zone>

      {/* 2 · Jordvaskeanlegg — cutaway hall */}
      <Zone {...zoneProps("vask")}>
        <mesh position={[0, 0.8, -1.25]}>
          <boxGeometry args={[4.6, 1.6, 0.06]} />
          <meshStandardMaterial color="#b6b8b2" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[-2.3, 0.8, 0]}>
          <boxGeometry args={[0.06, 1.6, 2.5]} />
          <meshStandardMaterial color="#a9aca6" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* roof trusses */}
        {[-1.8, -0.9, 0, 0.9, 1.8].map((x) => (
          <mesh key={x} position={[x, 1.62, 0]}>
            <boxGeometry args={[0.05, 0.06, 2.5]} />
            <meshStandardMaterial color="#5d6461" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 1.66, -0.6]} rotation-x={0.08}>
          <boxGeometry args={[4.6, 0.02, 1.3]} />
          <meshStandardMaterial color="#9fb7b4" transparent opacity={0.18} roughness={0.1} metalness={0.4} depthWrite={false} />
        </mesh>
        {/* plant inside */}
        <mesh position={[-0.2, 0.75, -0.3]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.32, 0.32, 1.4, 28]} />
          <meshStandardMaterial color="#9ea6a3" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[-0.2, 0.35, -0.3]}>
          <boxGeometry args={[1.5, 0.12, 0.7]} />
          <meshStandardMaterial color="#e0e3df" metalness={0.4} roughness={0.4} />
        </mesh>
        <Silo position={[1.4, 0, -0.8]} r={0.22} h={1.05} color="#3b7fb0" />
        <Tank position={[1.25, 0, 0.35]} r={0.35} h={0.32} />
        <Conveyor from={[-1.9, 0.08, 0.5]} to={[-0.9, 0.85, -0.2]} width={0.1} />
        <Conveyor from={[0.5, 0.85, -0.3]} to={[1.9, 0.1, 0.9]} width={0.1} />
        <Pile position={[-0.8, 0, 0.75]} r={0.45} h={0.38} color="#c8b089" seed={25} />
        <Pile position={[0.3, 0, 0.85]} r={0.4} h={0.32} color="#9a958c" seed={26} />
        <Steam position={[1.4, 1.9, -0.8]} count={Math.round(30 * k)} />
      </Zone>

      {/* 3 · Jorddampeanlegg */}
      <Zone {...zoneProps("damp")}>
        <Hall size={[1.2, 0.55, 0.8]} color="#d0d2cb" />
        <mesh position={[0.4, 0.85, -0.15]}>
          <cylinderGeometry args={[0.06, 0.07, 0.7, 16]} />
          <meshStandardMaterial color="#7b817e" metalness={0.7} roughness={0.35} />
        </mesh>
        {!reducedMotion && <Steam position={[0.4, 2.2, -0.15]} count={Math.round(60 * k) + 10} />}
        <Pile position={[-0.75, 0, 0.6]} r={0.35} h={0.25} color="#3d2c20" seed={27} />
      </Zone>

      {/* 4 · Gjenvunne masser */}
      <Zone {...zoneProps("lager")}>
        {[
          { p: [-0.7, 0, -0.5] as V3, c: "#cdb48a" },
          { p: [0.45, 0, -0.6] as V3, c: "#a19d94" },
          { p: [-0.5, 0, 0.65] as V3, c: "#8a8781" },
          { p: [0.7, 0, 0.55] as V3, c: "#6f6d68" },
        ].map((pile, i) => (
          <Pile key={i} position={pile.p} r={0.55} h={0.42} color={pile.c} seed={30 + i} grain={i === 0 ? 0.2 : 0.4} />
        ))}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.3, 0.05]}>
            <boxGeometry args={[0.04, 0.6, 2.1]} />
            <meshStandardMaterial color="#8d908a" roughness={0.8} />
          </mesh>
        ))}
      </Zone>

      {/* 5 · Laboratorium — the old hydraulics hall */}
      <Zone {...zoneProps("lab")}>
        <Hall size={[1.2, 0.6, 0.85]} color="#8e4b38" roof="#3a3634" />
        {[-0.36, -0.12, 0.12, 0.36].map((x) => (
          <mesh key={x} position={[x, 0.38, 0.43]}>
            <boxGeometry args={[0.14, 0.18, 0.01]} />
            <meshStandardMaterial color="#f6e7b8" emissive="#f6e7b8" emissiveIntensity={0.9} />
          </mesh>
        ))}
      </Zone>

      {/* 6 · ISPS-kai */}
      <Zone {...zoneProps("kai")}>
        {[-1.6, -0.5, 0.6, 1.7].map((x) => (
          <mesh key={x} position={[x, 0.07, 0.0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.1, 10]} />
            <meshStandardMaterial color="#2a2d2c" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <Ship position={[0.1, -0.02, 0.65]} rotation={0} scale={1.2} />
        <Conveyor from={[1.6, 0.06, -0.8]} to={[0.9, 0.55, 0.45]} width={0.08} />
      </Zone>

      {controls && (
        <OrbitControls
          ref={orbit}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.55}
          maxPolarAngle={1.15}
          minAzimuthAngle={-0.9}
          maxAzimuthAngle={0.9}
          autoRotate={!reducedMotion && !active}
          autoRotateSpeed={0.35}
        />
      )}
    </>
  );
}
