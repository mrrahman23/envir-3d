"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useSyncExternalStore } from "react";
import * as THREE from "three";
import { FRACTIONS, ScannedAggregate, type FractionId } from "@/three/materials";

const read = () => new URLSearchParams(window.location.search).get("fraction") ?? "16-32";
const noop = () => () => {};

/** Neutral studio: soft key, cool fill, contact shadow, transparent background. */
export default function StudioClient() {
  const fraction = useSyncExternalStore(noop, read, () => "") as FractionId;
  if (!fraction || !(fraction in FRACTIONS)) return <p style={{ padding: 40 }}>Ukjent fraksjon</p>;
  return (
    <div id="studio" style={{ position: "fixed", inset: 0, zIndex: 100, background: "transparent" }}>
      <Canvas
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        dpr={2}
        shadows
        camera={{ fov: 24, position: [0, 0.95, 1.85] }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          camera.lookAt(0, 0.08, 0);
        }}
      >
        <Suspense fallback={null}>
          <hemisphereLight args={["#f4f1ea", "#57534c", 0.8]} />
          <directionalLight position={[2.5, 4, 2]} intensity={2.6} color="#fff4e6" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
          <directionalLight position={[-3, 2, -1]} intensity={0.9} color="#cfe2ee" />
          <Environment resolution={256} frames={1} environmentIntensity={0.55}>
            <Lightformer form="rect" intensity={2} color="#fff6ea" position={[0, 4, 3]} scale={[6, 3, 1]} />
            <Lightformer form="rect" intensity={0.8} color="#d9e8f0" position={[-4, 1, -2]} scale={[4, 3, 1]} />
          </Environment>
          <ScannedAggregate fraction={fraction} radius={0.5} height={0.32} seed={11} />
          <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={2.2} blur={2.2} far={0.6} resolution={1024} />
          <Ready />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Ready() {
  if (typeof document !== "undefined") document.documentElement.dataset.studioReady = "1";
  return null;
}
