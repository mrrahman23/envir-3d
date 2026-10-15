"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

/**
 * Pinned scroll sections and late-mounting content change the page height after
 * ScrollTriggers have measured their start/end. Re-measure (debounced) whenever the
 * document height changes, so every scrubbed effect stays aligned with its element.
 */
export default function ScrollRefresh() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let timer = 0;
    let last = document.documentElement.scrollHeight;
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (h === last) return;
      last = h;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 180);
    });
    ro.observe(document.body);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);
  return null;
}
