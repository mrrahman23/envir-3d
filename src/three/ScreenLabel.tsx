"use client";

/**
 * Lightweight DOM label pinned to a 3D point.
 *
 * Replaces drei <Html>, which mounts a nested React root per label and unmounts it
 * synchronously inside the R3F commit — with React 19 that throws
 * "removeChild … not a child of this node" when a canvas is torn down and then
 * prevents the scene from remounting. Here the element is plain DOM, updated
 * imperatively each frame: no nested roots, nothing to race.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Props = {
  position: [number, number, number];
  /** Text content (rendered with textContent — never HTML). */
  text: string;
  /** Optional leading badge, e.g. a zone number. */
  badge?: string;
  className?: string;
  badgeClassName?: string;
  /** Scale with distance like a world-space label (k / distance). */
  distanceScale?: number;
  /** Fade out between these camera distances. */
  fade?: [number, number];
  onClick?: () => void;
  onHover?: (on: boolean) => void;
  zIndex?: number;
};

export default function ScreenLabel({ position, text, badge, className = "", badgeClassName = "", distanceScale, fade, onClick, onHover, zIndex = 10 }: Props) {
  const { gl, camera, size } = useThree();
  const group = useRef<THREE.Group>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const handlers = useRef({ onClick, onHover });
  useLayoutEffect(() => {
    handlers.current = { onClick, onHover };
  });

  const parts = useMemo(() => {
    const interactive = !!onClick;
    const el = document.createElement(interactive ? "button" : "div");
    el.setAttribute("aria-hidden", "true");
    if (interactive) (el as HTMLButtonElement).tabIndex = -1;
    el.style.cssText = `position:absolute;left:0;top:0;will-change:transform;pointer-events:${interactive ? "auto" : "none"};z-index:${zIndex};`;
    const badgeEl = document.createElement("span");
    const textEl = document.createElement("span");
    el.append(badgeEl, textEl);
    return { el, badgeEl, textEl };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const host = gl.domElement.parentElement;
    if (!host) return;
    host.appendChild(parts.el);
    const click = () => handlers.current.onClick?.();
    const enter = () => handlers.current.onHover?.(true);
    const leave = () => handlers.current.onHover?.(false);
    parts.el.addEventListener("click", click);
    parts.el.addEventListener("pointerenter", enter);
    parts.el.addEventListener("pointerleave", leave);
    return () => {
      parts.el.removeEventListener("click", click);
      parts.el.removeEventListener("pointerenter", enter);
      parts.el.removeEventListener("pointerleave", leave);
      parts.el.remove();
    };
  }, [gl, parts]);

  useEffect(() => {
    parts.el.className = className;
    parts.textEl.textContent = text;
    parts.badgeEl.textContent = badge ?? "";
    parts.badgeEl.className = badgeClassName;
    parts.badgeEl.style.display = badge ? "" : "none";
  }, [parts, className, text, badge, badgeClassName]);

  useFrame(() => {
    if (!group.current) return;
    group.current.getWorldPosition(world);
    ndc.copy(world).project(camera);
    const behind = ndc.z > 1 || ndc.z < -1;
    const dist = world.distanceTo(camera.position);
    let opacity = behind ? 0 : 1;
    if (fade) opacity *= 1 - THREE.MathUtils.smoothstep(dist, fade[0], fade[1]);
    const x = ((ndc.x + 1) / 2) * size.width;
    const y = ((1 - ndc.y) / 2) * size.height;
    const s = distanceScale ? THREE.MathUtils.clamp(distanceScale / dist, 0.45, 1.6) : 1;
    parts.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.toFixed(3)})`;
    parts.el.style.opacity = opacity.toFixed(2);
    parts.el.style.visibility = opacity < 0.02 ? "hidden" : "visible";
  });

  return <group ref={group} position={position} />;
}
