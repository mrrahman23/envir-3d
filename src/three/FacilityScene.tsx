"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { FacilityZoneId } from "@/content/site";
import type { Quality } from "@/lib/quality";
import { tierScale } from "@/lib/quality";
import { Conveyor, DustField, Hall, Pile, Ship, Silo, StudioLights, Tank, Truck, Water } from "./kit";
import { Forest } from "./nature";
import ScreenLabel from "./ScreenLabel";
import { pbrTexture } from "./textures";

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

// Vertical alpha gradient for the light column above a selected zone.
let beamTex: THREE.Texture | null = null;
function beamTexture() {
  if (beamTex) return beamTex;
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 128);
  beamTex = new THREE.CanvasTexture(c);
  return beamTex;
}

function Zone({
  id,
  label,
  active,
  hovered,
  onHover,
  onSelect,
  index,
  children,
}: {
  id: FacilityZoneId;
  label: string;
  active: boolean;
  hovered: boolean;
  onHover: (id: FacilityZoneId | null) => void;
  onSelect: (id: FacilityZoneId) => void;
  index: number;
  children: ReactNode;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const r = ZONE_RADIUS[id];
  useFrame(({ clock }, dt) => {
    const pulse = 0.82 + Math.sin(clock.elapsedTime * 2.6) * 0.18;
    const rm = ring.current?.material as THREE.MeshBasicMaterial | undefined;
    if (rm && ring.current) {
      // Stays "visible" at opacity 0 so warm-up compiles its shader before the first tap.
      rm.opacity = THREE.MathUtils.damp(rm.opacity, (active ? 0.9 : hovered ? 0.55 : 0) * pulse, 8, dt);
    }
    const bm = beam.current?.material as THREE.MeshBasicMaterial | undefined;
    if (bm && beam.current) {
      bm.opacity = THREE.MathUtils.damp(bm.opacity, active ? 0.13 : hovered ? 0.07 : 0, 6, dt);
    }
  });
  const pos = ZONE_POS[id];
  const expanded = active || hovered;
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
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[r * 0.9, r, 72]} />
        <meshBasicMaterial color="#b9d95a" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Soft light column: readable highlight even when the zone is partly occluded */}
      <mesh ref={beam} position={[0, 1.1, 0]}>
        <cylinderGeometry args={[r * 0.9, r * 0.9, 2.2, 48, 1, true]} />
        <meshBasicMaterial color="#b9d95a" alphaMap={beamTexture()} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* invisible hit area so the whole zone is easy to target */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[r, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <ScreenLabel
        position={[0, id === "vask" ? 2.1 : 1.35, 0]}
        badge={String(index + 1)}
        text={label}
        onClick={() => onSelect(id)}
        onHover={(on) => onHover(on ? id : null)}
        zIndex={20}
        className={`group flex h-8 items-center gap-2 whitespace-nowrap rounded-full border pl-[3px] text-xs font-semibold shadow-lg transition-[background-color,border-color,padding] duration-300 ${
          active ? "border-lime bg-lime pr-3 text-forest-950" : expanded ? "border-lime/70 bg-night/85 pr-3 text-white backdrop-blur" : "border-white/40 bg-night/75 pr-[3px] text-white backdrop-blur"
        } [&>span:last-child]:overflow-hidden [&>span:last-child]:transition-[max-width,opacity] [&>span:last-child]:duration-300 ${
          expanded ? "[&>span:last-child]:max-w-[10rem] [&>span:last-child]:opacity-100" : "[&>span:last-child]:max-w-0 [&>span:last-child]:opacity-0"
        }`}
        badgeClassName={`flex h-6 w-6 items-center justify-center rounded-full ${active ? "bg-forest-950/10" : "bg-white/10"}`}
      />
    </group>
  );
}

function Steam({ position, count }: { position: V3; count: number }) {
  return <DustField count={count} bounds={[0.5, 2.2, 0.5]} position={position} palette={["#e9eef0", "#ffffff", "#cfd8db", "#ffffff"]} size={[2, 5]} rise={0.25} opacity={0.35} glint={0} />;
}

// Overview framing, and the direction each zone is viewed from when selected.
const OVERVIEW_POS = new THREE.Vector3(0, 9.5, 12.5);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);
const VIEW_DIR = new THREE.Vector3(0.12, 0.62, 0.78).normalize();
// Wider portrait canvases need more distance to keep the zone in context.
const zoneDistance = (id: FacilityZoneId, aspect: number) => (5.6 + ZONE_RADIUS[id] * 2.3) * (aspect < 1.2 ? 1.3 : 1);

function FacilityScene({
  quality,
  reducedMotion,
  active,
  preview,
  onSelect,
  controls,
  labels,
}: {
  quality: Quality;
  reducedMotion: boolean;
  active: FacilityZoneId | null;
  /** Zone highlighted from the list (hover / focus) without selecting it. */
  preview: FacilityZoneId | null;
  onSelect: (id: FacilityZoneId) => void;
  controls: boolean;
  labels: Record<FacilityZoneId, string>;
}) {
  const k = tierScale(quality);
  const [hovered, setHovered] = useState<FacilityZoneId | null>(null);
  const orbit = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera, size } = useThree();
  const target = useMemo(() => OVERVIEW_TARGET.clone(), []);
  const goalPos = useMemo(() => new THREE.Vector3(), []);
  const goalTarget = useMemo(() => new THREE.Vector3(), []);
  const flying = useRef(true);
  const ids = Object.keys(ZONE_POS) as FacilityZoneId[];

  // Every new selection starts a fly-to; dragging the model cancels it.
  useEffect(() => {
    flying.current = true;
  }, [active]);
  useEffect(() => {
    const c = orbit.current;
    if (!c) return;
    const stop = () => {
      flying.current = false;
    };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (active) {
      const [x, , z] = ZONE_POS[active];
      goalTarget.set(x, 0.35, z);
      goalPos.copy(VIEW_DIR).multiplyScalar(zoneDistance(active, size.width / size.height)).add(goalTarget);
    } else {
      goalTarget.copy(OVERVIEW_TARGET);
      goalPos.copy(OVERVIEW_POS);
    }
    if (flying.current) {
      if (reducedMotion) {
        target.copy(goalTarget);
        camera.position.copy(goalPos);
        flying.current = false;
      } else {
        const lambda = 2.6;
        target.x = THREE.MathUtils.damp(target.x, goalTarget.x, lambda, dt);
        target.y = THREE.MathUtils.damp(target.y, goalTarget.y, lambda, dt);
        target.z = THREE.MathUtils.damp(target.z, goalTarget.z, lambda, dt);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, goalPos.x, lambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, goalPos.y, lambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, goalPos.z, lambda, dt);
        if (camera.position.distanceTo(goalPos) < 0.01 && target.distanceTo(goalTarget) < 0.01) flying.current = false;
      }
    }
    if (orbit.current) {
      if (flying.current) orbit.current.target.copy(target);
      orbit.current.update();
    } else {
      camera.lookAt(target);
    }
  });

  const landHeight = () => 0;
  // Static scenery and zone geometry are memoised: selecting a zone only changes
  // highlight state, so React skips re-reconciling ~200 scene elements (INP).
  const staticSite = useMemo(
    () => (
      <>
      {/* Land + fjord */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -1.2]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#4a514c" roughness={0.95} />
      </mesh>
      {/* Concrete yard — scanned CC0 concrete, tiled ~1 m per repeat */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -0.8]} receiveShadow>
        <planeGeometry args={[11.5, 5.6]} />
        <meshStandardMaterial
          color="#d4d6d0"
          map={pbrTexture("/assets/facility/concrete-albedo.webp", { repeat: [5.75, 2.8], srgb: true })}
          normalMap={pbrTexture("/assets/facility/concrete-normal.webp", { repeat: [5.75, 2.8] })}
          roughness={0.88}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, -4.4]}>
        <planeGeometry args={[16, 2.2]} />
        <meshStandardMaterial color="#344a33" roughness={1} />
      </mesh>
      <group position={[0, 0, -4.4]}>
        <Forest count={Math.round(110 * k) + 30} area={[15, 1.8]} height={landHeight} scale={1.05} seed={6} leafy={0.25} />
      </group>
      <Water size={[22, 9]} position={[0, -0.08, 7.1]} />
      {/* quay edge */}
      <mesh position={[0, -0.04, 2.8]}>
        <boxGeometry args={[16, 0.16, 0.2]} />
        <meshStandardMaterial color="#8f918b" roughness={0.8} />
      </mesh>
      </>
    ),
     
    [k],
  );
  const content = useMemo(
    () => ({
      mottak: (
        <>
        <mesh position={[0.4, 0.02, 0.7]}>
          <boxGeometry args={[1.3, 0.04, 0.5]} />
          <meshStandardMaterial color="#383c3b" metalness={0.5} roughness={0.5} />
        </mesh>
        <Truck position={[0.3, 0.04, 0.7]} rotation={0} scale={1.1} />
        <Pile position={[-0.4, 0, -0.4]} r={0.75} h={0.5} color="#4a3627" seed={21} />
        <Pile position={[0.55, 0, -0.5]} r={0.5} h={0.35} color="#5a4431" seed={22} />
        </>
      ),
      vask: (
        <>
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
        </>
      ),
      damp: (
        <>
        <Hall size={[1.2, 0.55, 0.8]} color="#d0d2cb" />
        <mesh position={[0.4, 0.85, -0.15]}>
          <cylinderGeometry args={[0.06, 0.07, 0.7, 16]} />
          <meshStandardMaterial color="#7b817e" metalness={0.7} roughness={0.35} />
        </mesh>
        {!reducedMotion && <Steam position={[0.4, 2.2, -0.15]} count={Math.round(60 * k) + 10} />}
        <Pile position={[-0.75, 0, 0.6]} r={0.35} h={0.25} color="#3d2c20" seed={27} />
        </>
      ),
      lager: (
        <>
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
        </>
      ),
      lab: (
        <>
        <Hall size={[1.2, 0.6, 0.85]} color="#8e4b38" roof="#3a3634" />
        {[-0.36, -0.12, 0.12, 0.36].map((x) => (
          <mesh key={x} position={[x, 0.38, 0.43]}>
            <boxGeometry args={[0.14, 0.18, 0.01]} />
            <meshStandardMaterial color="#f6e7b8" emissive="#f6e7b8" emissiveIntensity={0.9} />
          </mesh>
        ))}
        </>
      ),
      kai: (
        <>
        {[-1.6, -0.5, 0.6, 1.7].map((x) => (
          <mesh key={x} position={[x, 0.07, 0.0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.1, 10]} />
            <meshStandardMaterial color="#2a2d2c" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <Ship position={[0.1, -0.02, 0.65]} rotation={0} scale={1.2} />
        <Conveyor from={[1.6, 0.06, -0.8]} to={[0.9, 0.55, 0.45]} width={0.08} />
        </>
      ),
    }),
     
    [k, reducedMotion],
  );


  const zoneProps = (id: FacilityZoneId) => ({
    id,
    index: ids.indexOf(id),
    label: labels[id],
    active: active === id,
    hovered: hovered === id || preview === id,
    onHover: setHovered,
    onSelect,
  });

  return (
    <>
      <fog attach="fog" args={["#0b2622", 16, 34]} />
      <StudioLights env={quality !== "low"} intensity={0.95} shadows={quality === "high"} envIntensity={0.6} />

      {staticSite}

      {/* 1 · Massemottak */}
      <Zone {...zoneProps("mottak")}>{content.mottak}</Zone>

      {/* 2 · Jordvaskeanlegg — cutaway hall */}
      <Zone {...zoneProps("vask")}>{content.vask}</Zone>

      {/* 3 · Jorddampeanlegg */}
      <Zone {...zoneProps("damp")}>{content.damp}</Zone>

      {/* 4 · Gjenvunne masser */}
      <Zone {...zoneProps("lager")}>{content.lager}</Zone>

      {/* 5 · Laboratorium — the old hydraulics hall */}
      <Zone {...zoneProps("lab")}>{content.lab}</Zone>

      {/* 6 · ISPS-kai */}
      <Zone {...zoneProps("kai")}>{content.kai}</Zone>

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
          autoRotate={!reducedMotion && !active && !hovered && !preview}
          autoRotateSpeed={0.35}
        />
      )}
    </>
  );
}

// Memoised so urgent UI renders (labels, panel) skip the 3D tree; it updates via deferred props.
export default memo(FacilityScene);
