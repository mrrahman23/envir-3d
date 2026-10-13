"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not(.is-in), [data-reveal-img]:not(.is-in)";

/** Adds `.is-in` to [data-reveal] / [data-reveal-img] elements as they enter the viewport. */
export default function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const delay = el.dataset.revealDelay;
          if (delay) el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));
    scan();
    // Client components (e.g. 3D sections) can mount reveal targets later.
    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pathname]);
  return null;
}
