"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";

/** Gentle scroll-linked vertical drift for imagery. Disabled for reduced motion. */
export default function Parallax({ children, amount = 12, className = "" }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -amount / 2 },
        { yPercent: amount / 2, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } },
      );
    });
    return () => ctx.revert();
  }, [amount]);
  return (
    <div ref={ref} className={`absolute inset-x-0 -inset-y-[8%] will-change-transform ${className}`}>
      {children}
    </div>
  );
}
