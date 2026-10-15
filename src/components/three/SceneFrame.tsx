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
  componentDidCatch(error: unknown) {
    // Fall back to the poster, but keep the cause visible for debugging.
    console.error("[SceneFrame] 3D scene failed, showing fallback:", error);
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
  /**
   * With `eager`: hold the WebGL boot (shader compiles, texture uploads) until the first
   * scroll/touch/key, or this many ms after load — keeps phones responsive while the poster shows.
   */
  deferMs?: number;
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

// Input-aware scheduling: booting a scene (Three.js parse, scene build) is a long task,
// so it waits for a quiet moment instead of landing in front of a tap (INP).
let lastInput = 0;
if (typeof window !== "undefined") {
  const mark = () => (lastInput = performance.now());
  for (const t of ["pointerdown", "keydown", "wheel", "touchstart"]) window.addEventListener(t, mark, { passive: true, capture: true });
}
const QUIET_MS = 700;
/** Runs `cb` in idle time once there has been no user input for QUIET_MS. Returns a canceller. */
const idle = (cb: () => void): (() => void) => {
  let cancelled = false;
  let ric = 0;
  let timer = 0;
  const run = () => {
    if (cancelled) return;
    const since = performance.now() - lastInput;
    if (since < QUIET_MS) {
      timer = window.setTimeout(schedule, QUIET_MS - since);
      return;
    }
    cb();
  };
  function schedule() {
    if (cancelled) return;
    if (window.requestIdleCallback) ric = window.requestIdleCallback(run, { timeout: 1500 });
    else timer = window.setTimeout(run, 60);
  }
  schedule();
  return () => {
    cancelled = true;
    if (ric) window.cancelIdleCallback?.(ric);
    window.clearTimeout(timer);
  };
};

export default function SceneFrame({ poster, children, className = "", eager, deferMs, camera, label, background = "#07181a", interactive, shadows, transparent, alwaysRender }: Props) {
  const { quality, reducedMotion } = useQuality();
  const wrap = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  // Two-step teardown: scene content leaves first (drei <Html> labels run nested React
  // roots that must unmount through R3F), then the canvas itself a moment later.
  const [content, setContent] = useState(false);
  const teardown = useRef(0);
  const mountIdle = useRef<() => void>(() => {});
  const [visible, setVisible] = useState(!!eager);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [compiled, setCompiled] = useState(false);
  // Paused while a full-screen overlay (mobile menu) hides the scene.
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setCovered(!!(e as CustomEvent<{ open: boolean }>).detail?.open);
    window.addEventListener("envir:overlay", on);
    return () => window.removeEventListener("envir:overlay", on);
  }, []);
  // Set while we intentionally unmount the canvas: R3F force-loses the context on dispose,
  // which must not be mistaken for a crash.
  const leaving = useRef(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let cancelled = false;
    let cancelEager = () => {};
    if (eager) {
      // Above the fold: let the page (text, poster, hydration) settle first, then start WebGL when idle.
      const boot = () => {
        cancelEager = idle(() => {
          if (cancelled) return;
          setNear(true);
          cancelEager = idle(() => !cancelled && setContent(true));
        });
      };
      const go = () => {
        if (!deferMs) return boot();
        const events = ["scroll", "pointerdown", "touchstart", "keydown", "wheel"] as const;
        let timer = 0;
        const start = () => {
          window.clearTimeout(timer);
          events.forEach((t) => window.removeEventListener(t, start));
          if (!cancelled) boot();
        };
        events.forEach((t) => window.addEventListener(t, start, { passive: true, once: true }));
        timer = window.setTimeout(start, deferMs);
        cancelEager = () => {
          window.clearTimeout(timer);
          events.forEach((t) => window.removeEventListener(t, start));
        };
      };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    }
    // Mount within ~half a viewport; unmount far away to free GPU memory and contexts.
    const mountIO = new IntersectionObserver(
      ([e]) => {
        if (eager) return;
        window.clearTimeout(teardown.current);
        if (e.isIntersecting) {
          leaving.current = false;
          setFailed(false); // a genuinely lost context gets another chance on the next visit
          // Mount in idle time, renderer first and scene content one idle slot later, so
          // building a scene never lands as one long task in front of a user's tap (INP).
          mountIdle.current();
          mountIdle.current = idle(() => {
            setNear(true);
            mountIdle.current = idle(() => setContent(true));
          });
        } else {
          mountIdle.current();
          setContent(false);
          setReady(false);
          setCompiled(false);
          teardown.current = window.setTimeout(() => {
            leaving.current = true;
            setNear(false);
          }, 200);
        }
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    const visIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "10% 0px" });
    mountIO.observe(el);
    visIO.observe(el);
    return () => {
      cancelled = true;
      window.clearTimeout(teardown.current);
      mountIdle.current();
      cancelEager();
      mountIO.disconnect();
      visIO.disconnect();
    };
  }, [eager, deferMs]);

  const onCompiled = useCallback(() => setCompiled(true), []);
  const show3D = canRender3D(quality) && near && !failed;
  const frameloop = !visible || !compiled || covered ? "never" : reducedMotion && !alwaysRender ? "demand" : "always";

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
              // PCF ("percentage"): three r18x removed PCFSoftShadowMap (R3F's default for `true`) and warns.
              shadows={shadows && quality === "high" ? "percentage" : false}
              gl={{ antialias: quality !== "low", powerPreference: "high-performance", alpha: !!transparent, stencil: false }}
              camera={{ fov: camera?.fov ?? 35, position: camera?.position ?? [0, 2, 10], near: camera?.near ?? 0.1, far: camera?.far ?? 200 }}
              onCreated={({ gl, scene }) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.05;
                if (!transparent) scene.background = new THREE.Color(background);
                gl.domElement.addEventListener("webglcontextlost", () => {
                  if (leaving.current) return; // our own dispose on unmount
                  console.warn("[SceneFrame] WebGL context lost — showing fallback:", label);
                  setFailed(true);
                });
              }}
              tabIndex={-1}
              aria-hidden
            >
              <Suspense fallback={null}>
                {content && (
                  <>
                    <Warmup onDone={onCompiled} />
                    <FirstFrame onReady={() => setReady(true)} />
                    {children({ quality, reducedMotion })}
                  </>
                )}
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
    let finished = false;
    const finish = () => {
      if (finished || !alive) return;
      finished = true;
      onDone();
    };
    const id = window.setTimeout(() => {
      gl.compileAsync(scene, camera).catch(() => undefined).finally(finish);
    }, 0);
    // Never let a stalled async compile block the first frame (seen on remount).
    const guard = window.setTimeout(finish, 1800);
    return () => {
      alive = false;
      window.clearTimeout(id);
      window.clearTimeout(guard);
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
