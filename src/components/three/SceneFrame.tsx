"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { canRender3D, useQuality, type Quality } from "@/lib/quality";

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Props = {
  /** Rendered beneath the canvas: shown while loading, offscreen, or when 3D is unavailable. */
  poster: ReactNode;
  children: (ctx: { quality: Quality; reducedMotion: boolean }) => ReactNode;
  className?: string;
  /** Mount immediately (hero) instead of when near the viewport. */
  eager?: boolean;
  camera?: { fov?: number; position?: [number, number, number]; near?: number; far?: number };
  /** Accessible description of what the visualization shows. */
  label: string;
  background?: string;
  /** Allow pointer interaction with the canvas (facility explorer). */
  interactive?: boolean;
  shadows?: boolean;
  /** Transparent canvas so CSS backgrounds show through. */
  transparent?: boolean;
  /** Keep rendering every frame while visible, even with reduced motion (UI-driven scenes). */
  alwaysRender?: boolean;
};

export default function SceneFrame({ poster, children, className = "", eager, camera, label, background = "#07181a", interactive, shadows, transparent, alwaysRender }: Props) {
  const { quality, reducedMotion } = useQuality();
  const wrap = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(!!eager);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [compiled, setCompiled] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let cancelled = false;
    let idleId = 0;
    if (eager) {
      // Above the fold: let the page (text, poster, hydration) settle first, then start WebGL when idle.
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
      const go = () => {
        idleId = ric(() => !cancelled && setNear(true), { timeout: 2500 }) as number;
      };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    }
    // Mount within ~half a viewport; unmount far away to free GPU memory and contexts.
    const mountIO = new IntersectionObserver(
      ([e]) => {
        if (eager) return;
        setNear(e.isIntersecting);
        if (!e.isIntersecting) {
          setReady(false);
          setCompiled(false);
        }
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    const visIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "10% 0px" });
    mountIO.observe(el);
    visIO.observe(el);
    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(idleId);
      mountIO.disconnect();
      visIO.disconnect();
    };
  }, [eager]);

  const onCompiled = useCallback(() => setCompiled(true), []);
  const show3D = canRender3D(quality) && near && !failed;
  const frameloop = !visible || !compiled ? "never" : reducedMotion && !alwaysRender ? "demand" : "always";

  return (
    <div ref={wrap} className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden ${className}`} style={transparent ? undefined : { background }}>
      <div className={`absolute inset-0 transition-opacity duration-[1400ms] ${show3D && ready ? "opacity-0" : "opacity-100"}`}>{poster}</div>
      {show3D && (
        <div
          role="img"
          aria-label={label}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ${ready ? "opacity-100" : "opacity-0"} ${interactive ? "" : "pointer-events-none"}`}
        >
          <SceneBoundary onError={() => setFailed(true)}>
            <Canvas
              frameloop={frameloop}
              dpr={quality === "high" ? [1, 1.75] : quality === "medium" ? [1, 1.4] : [1, 1.15]}
              shadows={shadows && quality === "high"}
              gl={{ antialias: quality !== "low", powerPreference: "high-performance", alpha: !!transparent, stencil: false }}
              camera={{ fov: camera?.fov ?? 35, position: camera?.position ?? [0, 2, 10], near: camera?.near ?? 0.1, far: camera?.far ?? 200 }}
              onCreated={({ gl, scene }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.05;
                if (!transparent) scene.background = new THREE.Color(background);
                gl.domElement.addEventListener("webglcontextlost", () => setFailed(true));
              }}
              tabIndex={-1}
              aria-hidden
            >
              <Suspense fallback={null}>
                <Warmup onDone={onCompiled} />
                <FirstFrame onReady={() => setReady(true)} />
                {children({ quality, reducedMotion })}
              </Suspense>
            </Canvas>
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}


/** Compiles all shaders off the main thread (KHR_parallel_shader_compile) before the first frame. */
function Warmup({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let alive = true;
    // Wait one tick so every child has attached to the scene graph.
    const id = window.setTimeout(() => {
      gl.compileAsync(scene, camera)
        .catch(() => undefined)
        .finally(() => alive && onDone());
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [gl, scene, camera, onDone]);
  return null;
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    // Let a couple of frames settle (shader compile) before revealing.
    requestAnimationFrame(() => requestAnimationFrame(onReady));
  });
  return null;
}
