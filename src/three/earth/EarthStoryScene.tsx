"use client";

/**
 * Earth → Norway → Bergen → Laksevåg → soil profile.
 * One scene, one camera; every frame is a pure function of (intro progress, scroll progress).
 * Stages load lazily: globe first (suspends the first frame), then region + terrain, then the
 * Laksevåg detail, then the geology cutaway as the visitor approaches it.
 */
import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { use, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Quality } from "@/lib/quality";
import ScreenLabel from "../ScreenLabel";
import { loadTexture, retainTextures, tierOf, urls } from "./assets";
import { Globe, RegionPatch, Sky, Stars } from "./Earth";
import { basisAt, GLOBE_CENTRE, R, toLocal } from "./geo";
import { LAYERS } from "./layers";
import { disposeMaterials, makeMaterials, type Rig } from "./rig";
import SoilProfile, { liftFor } from "./SoilProfile";
import Terrain from "./Terrain";
import {
  cutawayPose,
  descentPose,
  introPose,
  INTRO_SECONDS,
  LAKSEVAG,
  labelOpacity,
  layerLift,
  P,
  separation,
  smooth,
  ss,
  type Geo,
  type Orbit,
  type Story,
} from "./timeline";

declare global {
  interface Window {
    /** Set by scripts/bake-hero-posters.mjs to freeze the intro at a given progress. */
    __envirHeroIntro?: number;
  }
}

const sstep = THREE.MathUtils.smoothstep;
const lerpColor = (out: THREE.Color, a: THREE.Color, b: THREE.Color, t: number) => out.copy(a).lerp(b, t);
const C = (hex: string) => new THREE.Color(hex);
const PAL = {
  zenithLow: C("#5d86ad"),
  zenithHigh: C("#0e1c33"),
  haze: C("#a3b9cd"),
  sunHaze: C("#4a3f2e"),
  studioTop: C("#0d1816"),
  studioBottom: C("#1d2a26"),
  studioHaze: C("#000000"),
};

export default function EarthStoryScene({ quality, story }: { quality: Quality; story: Story }) {
  const tier = tierOf(quality);
  const u = useMemo(() => urls(tier), [tier]);
  const { gl, camera, size } = useThree();
  const maxAniso = Math.min(tier === "high" ? 8 : 4, gl.capabilities.getMaxAnisotropy());
  const globeTex = use(loadTexture(u.globe, { anisotropy: maxAniso }));
  const cloudTex = u.clouds ? use(loadTexture(u.clouds, { anisotropy: 2 })) : null;
  const rig = useMemo<Rig>(() => ({ mats: makeMaterials({ globe: globeTex, clouds: cloudTex }) }), [globeTex, cloudTex]);
  const [detailOn, setDetailOn] = useState(false);
  const [geologyOn, setGeologyOn] = useState(false);
  const [laksevagY, setLaksevagY] = useState<number | null>(null);
  const shadows = tier === "high";

  useEffect(() => () => disposeMaterials(rig.mats), [rig]);
  useEffect(() => retainTextures(), []);

  // Stage 2: the regional map (prefetched right after the globe is on screen).
  useEffect(() => {
    let alive = true;
    loadTexture(u.region, { anisotropy: maxAniso })
      .then((t) => {
        if (!alive) return;
        gl.initTexture(t);
        rig.mats.surface.uniforms.uRegion.value = t;
        regionReady.current = true;
      })
      .catch((e) => console.warn("[EarthStory] region failed:", e));
    return () => {
      alive = false;
    };
  }, [u.region, gl, rig, maxAniso]);

  // ---------------------------------------------------------------------------
  // Per-frame driver (allocation-free).
  const regionReady = useRef(false);
  const st = useRef({ t: -1, ps: -1, regionW: 0, last: "", readyFlag: false, geologyAsked: false, labels: [-1, -1, -1, -1, -1, -1] });
  const tmp = useMemo(
    () => ({
      geo: { lat: 0, lon: 0, h: 0, dist: 1, heading: 0, pitch: 0 } as Geo,
      intro: { lat: 0, lon: 0, h: 0, dist: 1, heading: 0, pitch: 0 } as Geo,
      orbit: { az: 0, el: 0, dist: 1, y: 0 } as Orbit,
      e: new THREE.Vector3(),
      n: new THREE.Vector3(),
      up: new THREE.Vector3(),
      f: new THREE.Vector3(),
      h: new THREE.Vector3(),
      target: new THREE.Vector3(),
      right: new THREE.Vector3(),
      m: new THREE.Matrix4(),
      c: new THREE.Color(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const s = st.current;
    const dt = Math.min(delta, 1 / 20);
    const cam = camera as THREE.PerspectiveCamera;
    const mats = rig.mats;

    // Intro clock: starts on the first rendered frame; rushes to the end once the visitor scrolls.
    const frozen = typeof window.__envirHeroIntro === "number" ? window.__envirHeroIntro : null;
    if (s.t < 0) s.t = story.scroll > 0.02 ? 1 : 0;
    if (frozen !== null) s.t = frozen;
    else if (s.t < 1) s.t = Math.min(1, s.t + (dt / INTRO_SECONDS) * (story.scroll > 0.003 ? 7 : 1));
    if (story.intro !== s.t) {
      story.intro = s.t;
      story.listeners.forEach((l) => l());
    }

    // Damped scroll for a filmic camera (converges to the pure function of scroll).
    if (s.ps < 0) s.ps = story.scroll;
    s.ps += (story.scroll - s.ps) * (1 - Math.exp(-dt * 6));
    if (Math.abs(story.scroll - s.ps) < 1e-5) s.ps = story.scroll;
    const p = s.ps;

    if (!s.geologyAsked && (p > 0.05 || (s.t >= 1 && state.clock.elapsedTime > INTRO_SECONDS + 3))) {
      s.geologyAsked = true;
      setGeologyOn(true);
    }

    const portrait = size.width / size.height < 0.85;
    const host = gl.domElement.parentElement;
    const cutaway = p >= P.cutaway && !!rig.soil;
    s.regionW = regionReady.current ? Math.min(1, s.regionW + dt * 2) : 0;
    mats.surface.uniforms.uRegionOn.value = s.regionW;
    mats.terrainBig.uniforms.uTime.value = state.clock.elapsedTime;
    mats.terrainDetail.uniforms.uTime.value = state.clock.elapsedTime;

    const sky = mats.sky.uniforms;
    if (!cutaway) {
      // ------------------------------------------------------------- map phases
      introPose(s.t, tmp.intro);
      const g = p > 0 ? descentPose(p, tmp.intro, tmp.geo) : tmp.intro;
      const D2R = Math.PI / 180;
      basisAt(g.lat, g.lon, tmp.e, tmp.n, tmp.up);
      toLocal(g.lat, g.lon, g.h, tmp.target);
      const pitch = g.pitch * D2R;
      const hd = g.heading * D2R;
      tmp.h.copy(tmp.n).multiplyScalar(Math.cos(hd)).addScaledVector(tmp.e, Math.sin(hd));
      tmp.f.copy(tmp.h).multiplyScalar(Math.cos(pitch)).addScaledVector(tmp.up, -Math.sin(pitch));
      cam.position.copy(tmp.target).addScaledVector(tmp.f, -g.dist);
      // Keep the camera above the terrain (DEM sampled on the CPU).
      if (rig.ground && g.dist < 40) {
        const gh = rig.ground(cam.position.x, cam.position.z) - (cam.position.x ** 2 + cam.position.z ** 2) / (2 * R);
        if (cam.position.y < gh + 0.06) cam.position.y = gh + 0.06;
      }
      tmp.up.multiplyScalar(Math.cos(pitch)).addScaledVector(tmp.h, Math.sin(pitch));
      tmp.right.crossVectors(tmp.f, tmp.up).normalize();
      tmp.up.crossVectors(tmp.right, tmp.f).normalize();
      tmp.m.makeBasis(tmp.right, tmp.up, tmp.f.negate());
      cam.quaternion.setFromRotationMatrix(tmp.m);

      const alt = cam.position.distanceTo(GLOBE_CENTRE) - R;
      const altG = rig.ground ? cam.position.y - Math.max(0, rig.ground(cam.position.x, cam.position.z)) : alt;
      cam.fov = portrait ? 52 : 35;
      cam.near = Math.max(0.004, Math.min(alt * 0.3, altG * 0.2));
      cam.far = Math.sqrt(Math.max(0, (R + alt) ** 2 - R * R)) * 1.25 + 60;

      // Atmosphere and visibility by altitude.
      const space = sstep(alt, 60, 400);
      mats.shared.uFogDensity.value = 0.012 * Math.exp(-alt / 30) * (1 - space);
      mats.shared.uHaze.value.copy(PAL.haze);
      mats.shared.uSunHaze.value.copy(PAL.sunHaze);
      mats.surface.uniforms.uSpace.value = sstep(alt, 250, 2500);
      mats.surface.uniforms.uBergenOn.value = mats.surface.uniforms.uBergen.value ? 1 - sstep(alt, 110, 380) : 0;
      mats.surface.uniforms.uDeepWater.value = 1 - sstep(alt, 200, 1400);
      sky.uSpace.value = space;
      sky.uDip.value = Math.sqrt((2 * Math.max(alt, 0)) / R);
      sky.uUp.value.copy(cam.position).sub(GLOBE_CENTRE).normalize();
      lerpColor(sky.uZenith.value, PAL.zenithLow, PAL.zenithHigh, sstep(alt, 4, 70));
      if (mats.clouds) mats.clouds.uniforms.uOpacity.value = sstep(alt, 900, 3500) * 0.92;
      mats.atmo.uniforms.uIntensity.value = sstep(alt, 150, 1500) * 0.85;
      mats.stars.uniforms.uOpacity.value = sstep(alt, 1500, 8000) * 0.75;
      mats.stars.uniforms.uScale.value = state.viewport.dpr;

      const tOpacity = 1 - sstep(alt, 55, 140);
      mats.terrainBig.uniforms.uOpacity.value = tOpacity;
      const dOpacity = 1 - sstep(altG, 3, 7);
      mats.terrainDetail.uniforms.uOpacity.value = dOpacity;
      mats.terrainBig.uniforms.uHoleDepth.value = rig.detail ? 0.08 * dOpacity : 0;

      if (rig.globe) rig.globe.visible = alt > 180;
      if (rig.clouds) rig.clouds.visible = alt > 900;
      if (rig.atmo) rig.atmo.visible = alt > 150;
      if (rig.stars) rig.stars.visible = alt > 1500;
      if (rig.patch) rig.patch.visible = alt < 3200;
      if (rig.terrain) rig.terrain.visible = tOpacity > 0.002;
      if (rig.detail) rig.detail.visible = dOpacity > 0.002;
      if (rig.soil) rig.soil.group.visible = false;
      if (rig.map) rig.map.visible = true;

      // Bake/QA flag: the settled aerial is fully loaded.
      if (!s.readyFlag && rig.terrain && regionReady.current) {
        s.readyFlag = true;
        document.documentElement.dataset.heroScene = "ready";
      }
    } else {
      // ------------------------------------------------------------- cutaway
      const o = cutawayPose(p, tmp.orbit);
      const D2R = Math.PI / 180;
      const dist = o.dist * (portrait ? 1.32 : 1);
      tmp.target.set(0, o.y, 0);
      cam.position.set(Math.sin(o.az * D2R) * Math.cos(o.el * D2R), Math.sin(o.el * D2R), Math.cos(o.az * D2R) * Math.cos(o.el * D2R)).multiplyScalar(dist).add(tmp.target);
      cam.up.set(0, 1, 0);
      cam.lookAt(tmp.target);
      cam.fov = portrait ? 44 : 32;
      cam.near = 0.05;
      cam.far = 80;

      mats.shared.uFogDensity.value = 0;
      mats.shared.uHaze.value.copy(PAL.studioBottom);
      mats.shared.uSunHaze.value.copy(PAL.studioHaze);
      sky.uSpace.value = 0;
      sky.uDip.value = 0.12;
      sky.uUp.value.set(0, 1, 0);
      sky.uZenith.value.copy(PAL.studioTop);

      if (rig.globe) rig.globe.visible = false;
      if (rig.clouds) rig.clouds.visible = false;
      if (rig.atmo) rig.atmo.visible = false;
      if (rig.stars) rig.stars.visible = false;
      if (rig.patch) rig.patch.visible = false;
      if (rig.terrain) rig.terrain.visible = false;
      if (rig.detail) rig.detail.visible = false;
      if (rig.map) rig.map.visible = false;

      const soil = rig.soil!;
      soil.group.visible = true;
      const sep = separation(p);
      for (let i = 0; i < soil.slabs.length; i++) soil.slabs[i].position.y = liftFor(i) * layerLift(sep, i, LAYERS.length);
    }

    // Composition: keep the subject clear of the copy column (left on desktop, bottom on phones).
    const W = size.width;
    const H = size.height;
    const k = cutaway ? 1 : 1 - ss(p, 0.2, 0.34) * 0.4;
    const ox = portrait ? (cutaway ? (0.1 + 0.13 * smooth(separation(p))) * W : 0) : -(cutaway ? 0.13 : 0.17) * W * k;
    const oy = portrait ? (cutaway ? 0.13 : 0.24) * H * k : 0;
    cam.setViewOffset(W, H, ox, oy, W, H);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    sky.uInvProj.value.copy(cam.projectionMatrixInverse);
    sky.uCamWorld.value.copy(cam.matrixWorld);

    // Label visibility through CSS variables on the canvas host (cheap, no React state).
    if (host) {
      for (let i = 0; i < LAYERS.length; i++) {
        const v = cutaway ? Math.round(labelOpacity(p, i) * 100) / 100 : 0;
        if (s.labels[i] !== v) {
          s.labels[i] = v;
          host.style.setProperty(`--geo-l${i}`, String(v));
        }
      }
      const lk = cutaway ? 0 : Math.round(ss(p, 0.1, 0.16) * (1 - ss(p, 0.24, 0.29)) * 100) / 100;
      if (s.labels[5] !== lk) {
        s.labels[5] = lk;
        host.style.setProperty("--geo-lk", String(lk));
      }
    }
  });

  return (
    <>
      <Sky rig={rig} />
      <Stars rig={rig} count={tier === "low" ? 1200 : 2600} />
      <group ref={(g) => void (rig.map = g ?? undefined)}>
        <Globe rig={rig} segments={tier === "low" ? [128, 80] : [192, 128]} />
        <RegionPatch rig={rig} step={tier === "low" ? 0.4 : 0.25} />
        <Terrain rig={rig} kind="big" map={u.bergen} dem={u.bergenDem} segments={tier === "low" ? 128 : 255} anisotropy={maxAniso} onReady={() => setDetailOn(true)} />
        {detailOn && (
          <Terrain
            rig={rig}
            kind="detail"
            map={u.detail}
            dem={u.detailDem}
            segments={tier === "low" ? 128 : 255}
            anisotropy={maxAniso}
            onReady={() => {
              const p = toLocal(LAKSEVAG.lat, LAKSEVAG.lon);
              setLaksevagY((rig.ground?.(p.x, p.z) ?? 0) + 0.03);
            }}
          />
        )}
        {laksevagY !== null && <LaksevagLabel y={laksevagY} />}
      </group>
      {geologyOn && (
        <>
          <hemisphereLight args={["#d5e0e6", "#2e261d", 0.55]} />
          <directionalLight
            position={[-3.2, 5.2, 4.2]}
            intensity={2.3}
            color="#fff1de"
            castShadow={shadows}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
            shadow-camera-near={1}
            shadow-camera-far={16}
            shadow-bias={-0.0004}
            shadow-normalBias={0.02}
          />
          <Environment frames={1} resolution={64}>
            <Lightformer form="rect" intensity={1.2} color="#dfe8ee" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
            <Lightformer form="rect" intensity={0.8} color="#fff0dc" position={[-5, 2, 4]} scale={[4, 3, 1]} />
            <Lightformer form="rect" intensity={0.25} color="#8fa3a0" position={[5, 0, -3]} scale={[4, 3, 1]} />
          </Environment>
          <SoilProfile rig={rig} tier={tier} shadows={shadows} />
        </>
      )}
    </>
  );
}

function LaksevagLabel({ y }: { y: number }) {
  const pos = useMemo(() => {
    const p = toLocal(LAKSEVAG.lat, LAKSEVAG.lon);
    return [p.x, y, p.z] as [number, number, number];
  }, [y]);
  return (
    <ScreenLabel
      position={pos}
      text="Laksevåg"
      zIndex={3}
      className="[&>span]:[opacity:var(--geo-lk,0)] text-[0.7rem] font-medium uppercase tracking-[0.2em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_14px_rgba(7,24,26,0.85)] [translate:0_-120%]"
    />
  );
}
