"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { company } from "@/content/site";

type Conn = { saveData?: boolean; effectiveType?: string };

/** Data saver / slow connections get the still frame only. */
function constrainedNetwork() {
  try {
    const c = (navigator as Navigator & { connection?: Conn }).connection;
    if (!c) return false;
    return !!c.saveData || /(^|-)2g$|^3g$/.test(c.effectiveType ?? "");
  } catch {
    return false;
  }
}

const VIMEO_ORIGIN = "https://player.vimeo.com";

/**
 * Envir's own muted 30 s background film (Vimeo), layered over a still frame
 * from the same film. The iframe is only mounted once the band is near the
 * viewport and the visitor has interacted (or ~4 s have passed), and it fades
 * in only after the player reports actual playback — until then, or if it
 * never loads, the poster stays.
 */
export default function FilmBackdrop({ allowVideo, className = "" }: { allowVideo: boolean; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Decide when to mount the player.
  useEffect(() => {
    if (!allowVideo || constrainedNetwork()) return;
    const el = root.current;
    if (!el) return;
    let near = false;
    let ready = false;
    const tryMount = () => near && ready && setMount(true);
    const markReady = () => {
      ready = true;
      tryMount();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, markReady, { once: true, passive: true }));
    const idle = window.setTimeout(markReady, 4000);
    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        tryMount();
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(idle);
      events.forEach((e) => window.removeEventListener(e, markReady));
    };
  }, [allowVideo]);

  // Listen for real playback before revealing; pause while off-screen.
  useEffect(() => {
    if (!mount) return;
    let ready = false;
    let visible = true;
    const post = (msg: object) => {
      if (ready) frame.current?.contentWindow?.postMessage(JSON.stringify(msg), VIMEO_ORIGIN);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== VIMEO_ORIGIN || e.source !== frame.current?.contentWindow) return;
      let data: { event?: string; data?: { seconds?: number } };
      try {
        data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (data?.event === "ready") {
        ready = true;
        if (!visible) post({ method: "pause" });
        post({ method: "addEventListener", value: "timeupdate" });
        post({ method: "addEventListener", value: "playProgress" });
      } else if ((data?.event === "timeupdate" || data?.event === "playProgress") && (data.data?.seconds ?? 0) > 0.05) {
        setPlaying(true);
      }
    };
    window.addEventListener("message", onMessage);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        post({ method: visible ? "play" : "pause" });
      },
      { threshold: 0 },
    );
    if (root.current) io.observe(root.current);
    return () => {
      window.removeEventListener("message", onMessage);
      io.disconnect();
    };
  }, [mount]);

  return (
    <div ref={root} aria-hidden className={`absolute inset-0 overflow-hidden bg-night [container-type:size] ${className}`}>
      <Image
        src="/assets/envir-hd/envir-film-poster.webp"
        alt=""
        fill
        sizes="100vw"
        quality={80}
        className="object-cover object-[50%_45%] max-md:hidden"
      />
      <Image
        src="/assets/envir-hd/envir-film-poster-m.webp"
        alt=""
        fill
        sizes="100vw"
        quality={80}
        className="object-cover object-[62%_50%] md:hidden"
      />
      {mount && (
        <iframe
          ref={frame}
          src={company.backgroundFilm}
          title="Envirs bakgrunnsfilm fra anlegget på Laksevåg (uten lyd)"
          tabIndex={-1}
          allow="autoplay; fullscreen; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100%,56.25cqw)] w-[max(100%,177.78cqh)] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-[1400ms] ease-out"
          style={{ opacity: playing ? 1 : 0 }}
        />
      )}
    </div>
  );
}
