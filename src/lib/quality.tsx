"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

/**
 * Rendering tiers:
 *  - high:    full scenes, shadows, dense particles (desktop GPUs)
 *  - medium:  full scenes, fewer particles, no shadows
 *  - low:     simplified compositions (phones / tablets / modest hardware)
 *  - static:  no WebGL — poster images and static diagrams only
 *  - pending: not yet detected (SSR + first client paint) → render posters
 */
export type Quality = "high" | "medium" | "low" | "static" | "pending";
type Pref = "auto" | "off";

const PREF_KEY = "envir:3d";

function detect(): Exclude<Quality, "pending"> {
  try {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (nav.connection?.saveData) return "static";
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return "static";
    const mem = nav.deviceMemory ?? 8;
    const cores = nav.hardwareConcurrency ?? 8;
    if (mem <= 2 || cores <= 2) return "static";
    const small = window.matchMedia("(max-width: 767px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (small || mem <= 4 || cores <= 4) return "low";
    if (coarse || cores <= 6) return "medium";
    return "high";
  } catch {
    return "static";
  }
}

let detected: Exclude<Quality, "pending"> | null = null;
const listeners = new Set<() => void>();

// In-memory copy so the toggle still works when storage is blocked.
let memPref: Pref | null = null;

function readPref(): Pref {
  if (memPref) return memPref;
  try {
    return localStorage.getItem(PREF_KEY) === "off" ? "off" : "auto";
  } catch {
    return "auto";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
  };
}

function snapshot(): string {
  if (!detected) detected = detect();
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return `${readPref() === "off" ? "static" : detected}|${rm ? 1 : 0}|${detected === "static" ? 0 : 1}`;
}

const serverSnapshot = () => "pending|0|0";

type Ctx = {
  quality: Quality;
  reducedMotion: boolean;
  enabled3D: boolean;
  /** Hardware can render WebGL at all (toggle is meaningful). */
  capable: boolean;
  set3D: (on: boolean) => void;
};

const QualityContext = createContext<Ctx>({
  quality: "pending",
  reducedMotion: false,
  enabled3D: true,
  capable: false,
  set3D: () => {},
});

export function QualityProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [q, rm, cap] = snap.split("|");
  const set3D = useCallback((on: boolean) => {
    memPref = on ? "auto" : "off";
    try {
      localStorage.setItem(PREF_KEY, on ? "auto" : "off");
    } catch {
      /* storage unavailable: preference lasts for this page only */
    }
    listeners.forEach((l) => l());
  }, []);
  const value = useMemo<Ctx>(
    () => ({
      quality: q as Quality,
      reducedMotion: rm === "1",
      enabled3D: q !== "static",
      capable: cap === "1",
      set3D,
    }),
    [q, rm, cap, set3D],
  );
  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>;
}

export const useQuality = () => useContext(QualityContext);

/** True when a WebGL scene should be mounted. */
export function canRender3D(q: Quality) {
  return q === "high" || q === "medium" || q === "low";
}

/** Scales particle/instance counts per tier. */
export function tierScale(q: Quality) {
  return q === "high" ? 1 : q === "medium" ? 0.6 : 0.3;
}
