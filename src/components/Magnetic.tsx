"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Subtle magnetic pull for desktop pointers. No effect for touch, keyboard,
 * or reduced-motion users — the wrapped control works identically without it.
 */
export default function Magnetic({ children, strength = 0.22 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || rm) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return (
    <span ref={ref} className="inline-block transition-transform duration-500 ease-[var(--ease-cine)] will-change-transform">
      {children}
    </span>
  );
}
