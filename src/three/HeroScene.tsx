"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Quality } from "@/lib/quality";
import { tierScale } from "@/lib/quality";
import { Conveyor, DustField, EarthBlock, FlowLine, Hall, LightPole, makeHeightFn, Pile, Silo, Tank } from "./kit";
import { Forest } from "./nature";
import { useScannedStones } from "./materials";
import { mulberry32 } from "./noise";

const W = 7;
const D = 5;
const DEPTH = 2.6;
const PAD = { x: 1.25, z: -0.7, r: 1.75, h: 0.28 };

// One continuous move: close-up on the strata → pull back → orbit → approach the facility → settle.
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

const smooth = THREE.MathUtils.smoothstep;

export default function HeroScene({ quality, reducedMotion }: { quality: Quality; reducedMotion: boolean }) {
  const k = tierScale(quality);
  const rich = quality !== "low";
  const height = useMemo(() => makeHeightFn({ amp: 0.6, scale: 0.36, flat: PAD }), []);
  const camCurve = useMemo(() => new THREE.CatmullRomCurve3(CAM, false, "centripetal"), []);
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(LOOK, false, "centripetal"), []);
  const progress = useRef({ t: reducedMotion ? 1 : 0, reveal: reducedMotion ? 1 : 0 });
  // Rising clip plane: the layered Earth assembles from bedrock to surface.
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), reducedMotion ? 10 : -DEPTH), [reducedMotion]);
  const revealRef = useRef(reducedMotion ? 1 : 0);
  const streams = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);
  const facility = useRef<THREE.Group>(null);
  const look = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const { camera, size, invalidate, gl } = useThree();
  useLayoutEffect(() => {
    const prev = gl.toneMappingExposure;
    gl.toneMappingExposure = 1.18;
    gl.localClippingEnabled = true;
    return () => {
      gl.toneMappingExposure = prev;
    };
  }, [gl]);

  useLayoutEffect(() => {
    if (reducedMotion) {
      invalidate();
      return;
    }
    // A slow push into the soil, then a single eased move — no stops between beats.
    const tl = gsap.timeline({ delay: 0.2 });
    // A. Earth reveal: grains assemble the strata (1.7 s) while the camera holds the close-up,
    // then one continuous move pulls back, orbits and settles on the facility.
    tl.to(progress.current, { reveal: 1, duration: 1.9, ease: "power2.inOut" }, 0)
      .to(progress.current, { t: 0.1, duration: 1.6, ease: "sine.inOut" }, 0.3)
      .to(progress.current, { t: 1, duration: 6.4, ease: "power2.inOut" }, 1.6);
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

  useFrame(({ clock }, dt) => {
    const { t, reveal } = progress.current;
    revealRef.current = reveal;
    // Plane rises from the bedrock to above the surface (layers first, surface last).
    clip.constant = THREE.MathUtils.lerp(-DEPTH - 0.05, 1.4, reveal);
    if (streams.current) streams.current.visible = reveal > 0.97;
    const p = camCurve.getPoint(t);
    lookCurve.getPoint(t, look);
    const away = smooth(t, 0.15, 0.5);
    p.sub(look).multiplyScalar(1 + (pullBack - 1) * away).add(look);
    if (aspect < 1) {
      // Portrait: lift the block into the empty upper half, above the headline.
      const lift = 4.4 * away;
      look.y -= lift;
      p.y -= lift;
    }
    if (!reducedMotion) {
      // Damped parallax and a slow breathing drift once the move has settled.
      const pt = pointer.current;
      pt.sx = THREE.MathUtils.damp(pt.sx, pt.x, 2.2, dt);
      pt.sy = THREE.MathUtils.damp(pt.sy, pt.y, 2.2, dt);
      const settle = smooth(t, 0.82, 1);
      const time = clock.elapsedTime;
      p.x += (Math.sin(time * 0.09) * 0.4 + pt.sx * 0.45) * settle;
      p.y += (Math.cos(time * 0.07) * 0.12 - pt.sy * 0.22) * settle;
    }
    camera.position.copy(p);
    camera.lookAt(look);
    if (world.current) world.current.position.x = shiftX * away;
    // The facility rises in sync with the orbit that reveals it.
    const emerge = smooth(t, 0.4, 0.86);
    if (facility.current) {
      facility.current.children.forEach((c, i) => {
        const local = THREE.MathUtils.clamp(emerge * 1.5 - i * 0.04, 0, 1);
        c.scale.setScalar(Math.max(0.0001, 1 - Math.pow(1 - local, 3)));
      });
    }
  });

  const front = D / 2 + 0.012;
  const side = W / 2 + 0.012;

  return (
    <>
      <fog attach="fog" args={["#07181a", 11 * pullBack, 26 * pullBack]} />

      {/* Dusk rig: low warm sun behind-left for rim light, cool sky fill on the cut faces */}
      <hemisphereLight args={["#6f8f99", "#1a140f", 0.4]} />
      <directionalLight
        position={[-9, 4.5, -6]}
        intensity={3.4}
        color="#ffb877"
        castShadow={quality === "high"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[7, 6, 9]} intensity={1.6} color="#c3dbe6" />
      {/* Face light: keeps the strata — the heart of the story — legible on the cut faces */}
      <directionalLight position={[5, 1.2, 11]} intensity={1.5} color="#ffe6cc" />
      <spotLight position={[-3.5, 1.5, 7]} angle={0.5} penumbra={1} intensity={30} color="#ffe2bf" distance={18} />
      {rich ? (
        <Environment resolution={128} frames={1} environmentIntensity={0.35}>
          <Lightformer form="rect" intensity={2.5} color="#ffcf9a" position={[-6, 3, -5]} rotation-y={Math.PI / 4} scale={[8, 2, 1]} />
          <Lightformer form="rect" intensity={1} color="#9fd2e4" position={[5, 5, 6]} scale={[8, 4, 1]} />
        </Environment>
      ) : (
        <ambientLight intensity={0.35} />
      )}

      <group ref={world}>
        <EarthBlock
          clip={[clip]}
          surface={rich}
          size={[W, D]}
          depth={DEPTH}
          height={height}
          segments={quality === "low" ? 64 : 110}
          pad={{ ...PAD, r: PAD.r * 0.95, color: "#7d7b73" }}
          grass="#3b6034"
          moss="#5e7f3d"
          shadows={quality === "high"}
        />
        <Forest
          clip={[clip]}
          count={Math.round(420 * k) + 80}
          area={[W - 0.25, D - 0.25]}
          height={height}
          avoid={[{ x: PAD.x, z: PAD.z, r: PAD.r + 0.1 }]}
          scale={0.36}
          leafy={0.22}
          castShadow={quality === "high"}
        />

        {/* Facility emerging on the plateau, windows lit like a plant on an evening shift */}
        <group ref={facility} position={[PAD.x, PAD.h, PAD.z]}>
          <Hall position={[-0.35, 0, -0.55]} size={[1.5, 0.5, 0.75]} color="#c9ccc6" lit />
          <Hall position={[0.95, 0, -0.75]} size={[0.7, 0.36, 0.5]} color="#aeb3ac" roof="#3c4542" lit />
          <Silo position={[-1.25, 0, -0.35]} r={0.13} h={0.75} />
          <Silo position={[-1.25, 0, -0.05]} r={0.13} h={0.75} />
          <Tank position={[0.55, 0, 0.2]} r={0.24} h={0.2} />
          <Tank position={[1.08, 0, 0.12]} r={0.18} h={0.18} />
          <Conveyor from={[0.25, 0.32, -0.2]} to={[0.95, 0.04, 0.75]} width={0.06} />
          <Conveyor from={[-0.2, 0.36, -0.15]} to={[-0.2, 0.04, 0.9]} width={0.06} />
          <Conveyor from={[-0.7, 0.3, -0.15]} to={[-1.05, 0.04, 0.75]} width={0.06} />
          <Pile position={[0.98, 0, 0.82]} r={0.3} h={0.24} color="#a99d87" seed={2} grain={0.22} />
          <Pile position={[-0.2, 0, 0.98]} r={0.32} h={0.26} color="#8e8a83" seed={3} />
          <Pile position={[-1.08, 0, 0.82]} r={0.28} h={0.22} color="#6f6c66" seed={5} />
          <LightPole position={[0.45, 0, 0.55]} intensity={rich ? 0.7 : 0} />
          <LightPole position={[-0.65, 0, 0.6]} intensity={rich ? 0.7 : 0} />
        </group>

        {/* Water and process streams through the strata — they light up once the layers have formed */}
        <group ref={streams} visible={reducedMotion}>
        <FlowLine points={[[-W / 2, -0.62, front], [-1.6, -0.8, front], [0.2, -0.66, front], [1.8, -0.88, front], [W / 2, -0.74, front]]} color="#96d7e8" radius={0.009} speed={0.14} density={5} opacity={0.85} />
        <FlowLine points={[[-W / 2, -1.3, front], [-1.2, -1.1, front], [0.6, -1.36, front], [2.2, -1.16, front], [W / 2, -1.34, front]]} color="#b9d95a" radius={0.008} speed={0.18} density={4} opacity={0.7} />
        <FlowLine points={[[side, -0.66, D / 2], [side, -0.84, 0.6], [side, -0.7, -0.8], [side, -0.9, -D / 2]]} color="#96d7e8" radius={0.008} speed={0.16} density={4} opacity={0.7} />
        </group>

        {!reducedMotion && <AssemblingGrains reveal={revealRef} count={Math.round(320 * k) + 40} />}

        {/* A few mineral motes — enough for depth in the close-up, never a snowstorm */}
        <DustField count={Math.round(240 * k)} bounds={[W + 4, 6, D + 5]} position={[0, -0.5, 0]} size={[0.5, 1.5]} glint={0.02} opacity={0.6} rise={0.04} />
        <DustField count={Math.round(200 * k)} bounds={[3, 2.2, 1.2]} position={[-1, -0.9, D / 2 + 0.6]} size={[0.25, 0.95]} rise={0.025} palette={["#a6835c", "#6e523a", "#d7c7a8", "#b9d95a"]} glint={0.03} opacity={0.8} />
      </group>
    </>
  );
}

/**
 * Scanned soil grains that fly in from the camera side and settle onto the cut face
 * just as the rising clip plane reveals that depth — then sink into the surface.
 */
function AssemblingGrains({ reveal, count }: { reveal: React.RefObject<number>; count: number }) {
  const scans = useScannedStones();
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const done = useRef(false);
  const front = D / 2 + 0.03;
  const items = useMemo(() => {
    const rnd = mulberry32(42);
    return Array.from({ length: count }, (_, i) => {
      // Targets concentrate in the region framed by the opening close-up.
      const tx = -1.2 + (rnd() - 0.5) * 3.6;
      const ty = -DEPTH + 0.1 + rnd() * (DEPTH - 0.05);
      const target = new THREE.Vector3(tx, ty, front);
      const start = new THREE.Vector3(tx + (rnd() - 0.5) * 2.4, ty + (rnd() - 0.2) * 1.6, front + 0.6 + rnd() * 1.6);
      return {
        g: i % Math.max(1, scans.length),
        start,
        target,
        // arrival when the plane passes this depth
        at: (ty + DEPTH) / (DEPTH + 1.4),
        s: 0.018 + Math.pow(rnd(), 2) * 0.05,
        rot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
        spin: (rnd() - 0.5) * 6,
      };
    });
  }, [count, scans.length, front]);
  const groups = useMemo(() => scans.map((_, gi) => items.filter((it) => it.g === gi)), [scans, items]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  const tint = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    groups.forEach((list, gi) => {
      const mesh = refs.current[gi];
      if (!mesh) return;
      list.forEach((it, i) => {
        // Soil-toned near the surface, mineral grey at depth.
        const depth = (it.target.y + DEPTH) / DEPTH;
        mesh.setColorAt(i, tint.set(depth > 0.6 ? "#6b5039" : depth > 0.35 ? "#b39a74" : "#8e8b84"));
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [groups, tint]);

  useFrame(() => {
    if (done.current) return;
    const r = reveal.current ?? 1;
    groups.forEach((list, gi) => {
      const mesh = refs.current[gi];
      if (!mesh) return;
      list.forEach((it, i) => {
        // fly in during the 0.35 before arrival, then sink in over 0.12
        const k = THREE.MathUtils.clamp((r - (it.at - 0.35)) / 0.35, 0, 1);
        const fly = 1 - Math.pow(1 - k, 3);
        const sink = THREE.MathUtils.clamp((r - it.at) / 0.12, 0, 1);
        v.lerpVectors(it.start, it.target, fly);
        v.z -= sink * 0.05;
        e.set(it.rot.x + it.spin * (1 - fly), it.rot.y, it.rot.z);
        q.setFromEuler(e);
        const s = it.s * (k > 0 ? 1 : 0) * (1 - sink);
        sc.setScalar(Math.max(0.0001, s));
        m.compose(v, q, sc);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
    if (r >= 1) {
      done.current = true;
      refs.current.forEach((mesh) => mesh && (mesh.visible = false));
    }
  });

  return (
    <group>
      {groups.map((list, gi) =>
        list.length ? (
          <instancedMesh
            key={gi}
            ref={(el) => {
              refs.current[gi] = el;
            }}
            args={[scans[gi].geometry, scans[gi].material, list.length]}
            frustumCulled={false}
          />
        ) : null,
      )}
    </group>
  );
}
