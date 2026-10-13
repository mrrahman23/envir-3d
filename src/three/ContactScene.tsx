"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Quality } from "@/lib/quality";
import { tierScale } from "@/lib/quality";
import { Conveyor, EarthBlock, Hall, makeHeightFn, Pile, Silo, StudioLights } from "./kit";
import { Forest } from "./nature";

const PAD = { x: 1.6, z: -0.3, r: 1.5, h: 0.22 };

/** Bright, calm "arrival" landscape — the hero's earth block, healed and green. */
export default function ContactScene({ quality, reducedMotion }: { quality: Quality; reducedMotion: boolean }) {
  const k = tierScale(quality);
  const group = useRef<THREE.Group>(null);
  const height = useMemo(() => makeHeightFn({ amp: 0.75, scale: 0.3, flat: PAD }), []);
  useFrame(({ clock, camera, size }) => {
    const portrait = size.width / size.height < 1;
    camera.position.z = portrait ? 19 : 12.5;
    if (reducedMotion) {
      camera.lookAt(0.2, -0.3, 0);
      return;
    }
    const t = clock.elapsedTime;
    if (group.current) group.current.rotation.y = -0.35 + Math.sin(t * 0.06) * 0.18;
    camera.position.y = 4.2 + Math.sin(t * 0.1) * 0.15;
    camera.lookAt(0.2, -0.3, 0);
  });
  return (
    <>
      <fog attach="fog" args={["#eef1ea", 12, 30]} />
      <StudioLights env={quality !== "low"} intensity={1.35} warm="#fff6e8" cool="#cfe8f4" envIntensity={1} />
      <hemisphereLight args={["#ffffff", "#9fb08f", 0.9]} />
      <group ref={group} rotation-y={-0.35}>
        <EarthBlock surface={quality !== "low"} size={[9, 5.5]} depth={0.9} height={height} segments={quality === "low" ? 64 : 100} grass="#5f8a47" moss="#86a85a" rock="#9aa093" pad={{ ...PAD, color: "#b9b8ad" }} />
        <Forest count={Math.round(420 * k) + 80} area={[8.6, 5.2]} height={height} avoid={[{ x: PAD.x, z: PAD.z, r: PAD.r + 0.1 }]} scale={0.4} leafy={0.3} tint="#e9f2df" seed={17} />
        <group position={[PAD.x, PAD.h, PAD.z]}>
          <Hall position={[-0.2, 0, -0.45]} size={[1.3, 0.42, 0.62]} color="#f2f2ee" roof="#57605c" />
          <Silo position={[-1.05, 0, -0.3]} r={0.11} h={0.62} color="#f0f1ed" />
          <Conveyor from={[0.3, 0.28, -0.2]} to={[0.9, 0.04, 0.6]} width={0.05} />
          <Pile position={[0.95, 0, 0.66]} r={0.26} h={0.2} color="#cdb48a" seed={4} />
          <Pile position={[0.2, 0, 0.75]} r={0.22} h={0.16} color="#a19d94" seed={6} />
        </group>
      </group>
    </>
  );
}
