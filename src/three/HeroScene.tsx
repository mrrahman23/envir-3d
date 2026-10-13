"use client";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Quality } from "@/lib/quality";
import { tierScale } from "@/lib/quality";
import { Conveyor, DustField, EarthBlock, FlowLine, Hall, makeHeightFn, Pile, Pines, Silo, StudioLights, Tank } from "./kit";

const W = 7;
const D = 5;
const DEPTH = 2.6;
const PAD = { x: 1.25, z: -0.7, r: 1.75, h: 0.28 };

// Camera choreography: close-up → pull back → orbit → approach facility.
const CAM = [
  [-1.2, -1.0, 3.75],
  [-1.1, -0.75, 4.4],
  [-0.6, 0.7, 13.5],
  [7.6, 4.3, 11.2],
  [10.4, 5.3, 6.8],
  [10.2, 5.2, 12.4],
].map((p) => new THREE.Vector3(...p));
const LOOK = [
  [-1.2, -1.05, 2.5],
  [-1.1, -0.9, 2.4],
  [0, -0.8, 0],
  [0.4, -0.5, -0.2],
  [1.0, -0.2, -0.6],
  [0.3, -1.05, 0],
].map((p) => new THREE.Vector3(...p));

export default function HeroScene({ quality, reducedMotion }: { quality: Quality; reducedMotion: boolean }) {
  const k = tierScale(quality);
  const height = useMemo(() => makeHeightFn({ amp: 0.6, scale: 0.36, flat: PAD }), []);
  const camCurve = useMemo(() => new THREE.CatmullRomCurve3(CAM, false, "centripetal"), []);
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(LOOK, false, "centripetal"), []);
  const progress = useRef({ t: reducedMotion ? 1 : 0, emerge: reducedMotion ? 1 : 0 });
  const world = useRef<THREE.Group>(null);
  const facility = useRef<THREE.Group>(null);
  const look = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const { camera, size, invalidate } = useThree();

  useLayoutEffect(() => {
    if (reducedMotion) {
      invalidate();
      return;
    }
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(progress.current, { t: 0.18, duration: 1.6, ease: "sine.inOut" })
      .to(progress.current, { t: 0.55, duration: 2.2, ease: "power2.inOut" })
      .to(progress.current, { emerge: 1, duration: 2.4, ease: "power3.out" }, "-=0.6")
      .to(progress.current, { t: 1, duration: 2.8, ease: "power2.inOut" }, "<");
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      tl.kill();
      window.removeEventListener("pointermove", onMove);
    };
  }, [reducedMotion, invalidate]);

  // Compose the block to the right of the headline on wide screens.
  const aspect = size.width / size.height;
  const shiftX = aspect > 1.25 ? Math.min(3.2, (aspect - 1.25) * 3.4 + 1.4) : 0;
  const pullBack = aspect < 0.8 ? 1.95 : aspect < 1.25 ? 1.3 : 1;

  useFrame(({ clock }) => {
    const { t, emerge } = progress.current;
    const p = camCurve.getPoint(t);
    lookCurve.getPoint(t, look);
    // Pull back on narrow screens, but only once out of the close-up.
    const away = THREE.MathUtils.smoothstep(t, 0.15, 0.5);
    p.sub(look).multiplyScalar(1 + (pullBack - 1) * away).add(look);
    // Portrait: lift the block into the empty upper half, above the headline.
    if (aspect < 1) {
      const lift = 4.4 * away;
      look.y -= lift;
      p.y -= lift;
    }
    if (!reducedMotion) {
      const settle = THREE.MathUtils.smoothstep(t, 0.85, 1);
      const time = clock.elapsedTime;
      p.x += (Math.sin(time * 0.12) * 0.45 + pointer.current.x * 0.35) * settle;
      p.y += (Math.cos(time * 0.1) * 0.15 - pointer.current.y * 0.2) * settle;
    }
    camera.position.copy(p);
    camera.lookAt(look);
    if (world.current) world.current.position.x = shiftX * away;
    if (facility.current) {
      facility.current.children.forEach((c, i) => {
        const local = THREE.MathUtils.clamp(emerge * 1.6 - i * 0.07, 0, 1);
        const e = 1 - Math.pow(1 - local, 3);
        c.scale.setScalar(Math.max(0.0001, e));
      });
    }
  });

  const front = D / 2 + 0.012;
  const side = W / 2 + 0.012;

  return (
    <>
      <fog attach="fog" args={["#07181a", 11 * pullBack, 26 * pullBack]} />
      <StudioLights env={quality !== "low"} shadows={quality === "high"} envIntensity={0.55} />
      <spotLight position={[-4, 6, 6]} angle={0.5} penumbra={0.9} intensity={18} color="#ffe9c9" distance={22} />
      <group ref={world}>
        <group position={[0, 0, 0]}>
          <EarthBlock size={[W, D]} depth={DEPTH} height={height} segments={quality === "low" ? 64 : 110} pad={{ ...PAD, r: PAD.r * 0.95, color: "#7f7d74" }} shadows={quality === "high"} />
          <Pines count={Math.round(380 * k) + 60} area={[W - 0.25, D - 0.25]} height={height} avoid={[{ x: PAD.x, z: PAD.z, r: PAD.r + 0.1 }]} scale={0.42} color="#1d3526" />

          {/* Facility emerging on the plateau */}
          <group ref={facility} position={[PAD.x, PAD.h, PAD.z]}>
            <Hall position={[-0.35, 0, -0.55]} size={[1.5, 0.5, 0.75]} color="#d3d5cf" />
            <Hall position={[0.95, 0, -0.75]} size={[0.7, 0.36, 0.5]} color="#b9bdb6" roof="#3c4542" />
            <Silo position={[-1.25, 0, -0.35]} r={0.13} h={0.75} />
            <Silo position={[-1.25, 0, -0.05]} r={0.13} h={0.75} />
            <Tank position={[0.55, 0, 0.2]} r={0.24} h={0.2} />
            <Tank position={[1.08, 0, 0.12]} r={0.18} h={0.18} />
            <Conveyor from={[0.25, 0.32, -0.2]} to={[0.95, 0.04, 0.75]} width={0.06} />
            <Conveyor from={[-0.2, 0.36, -0.15]} to={[-0.2, 0.04, 0.9]} width={0.06} />
            <Conveyor from={[-0.7, 0.3, -0.15]} to={[-1.05, 0.04, 0.75]} width={0.06} />
            <Pile position={[0.98, 0, 0.82]} r={0.3} h={0.24} color="#a99d87" seed={2} />
            <Pile position={[-0.2, 0, 0.98]} r={0.32} h={0.26} color="#8e8a83" seed={3} />
            <Pile position={[-1.08, 0, 0.82]} r={0.28} h={0.22} color="#6f6c66" seed={5} />
          </group>
        </group>

        {/* Water + process energy flowing through the strata (front face) */}
        <FlowLine points={[[-W / 2, -0.55, front], [-1.6, -0.75, front], [0.2, -0.62, front], [1.8, -0.85, front], [W / 2, -0.7, front]]} color="#96d7e8" radius={0.012} speed={0.18} density={6} />
        <FlowLine points={[[-W / 2, -1.25, front], [-1.2, -1.05, front], [0.6, -1.32, front], [2.2, -1.12, front], [W / 2, -1.3, front]]} color="#b9d95a" radius={0.01} speed={0.25} density={5} />
        <FlowLine points={[[-W / 2, -1.9, front], [-0.6, -2.05, front], [1.2, -1.8, front], [W / 2, -2.0, front]]} color="#5cc6a4" radius={0.009} speed={0.14} density={4} opacity={0.7} />
        <FlowLine points={[[side, -0.6, D / 2], [side, -0.8, 0.6], [side, -0.65, -0.8], [side, -0.85, -D / 2]]} color="#96d7e8" radius={0.011} speed={0.2} density={4} />
        <FlowLine points={[[side, -1.4, D / 2], [side, -1.25, 0.2], [side, -1.45, -D / 2]]} color="#b9d95a" radius={0.009} speed={0.22} density={3} />

        {/* Mineral particles: dense near the face for the opening close-up, sparse around */}
        <DustField count={Math.round(900 * k)} bounds={[W + 4, 6, D + 5]} position={[0, -0.5, 0]} size={[0.5, 1.8]} />
        <DustField count={Math.round(500 * k)} bounds={[3, 2.2, 1.2]} position={[-1, -0.9, D / 2 + 0.6]} size={[0.25, 1.1]} rise={0.03} palette={["#a6835c", "#6e523a", "#d7c7a8", "#b9d95a"]} glint={0.1} />

      </group>
    </>
  );
}
