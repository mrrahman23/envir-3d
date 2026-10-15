"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { transformStages } from "@/content/site";
import SceneFrame from "@/components/three/SceneFrame";
import { canRender3D, useQuality } from "@/lib/quality";
import { STAGES, storyLight, storyPhase } from "@/lib/story";
import { Eyebrow, TextLink } from "@/components/ui";
import FilmBackdrop from "@/components/home/transform/FilmBackdrop";

const TransformScene = dynamic(() => import("@/three/TransformScene"), { ssr: false });

const STAGE_PHOTOS = [
  { src: "/assets/envir/service-massemottak.webp", alt: "Gravemaskin og operatør ved massene i mottakshallen" },
  { src: "/assets/envir/lonnsomt.webp", alt: "Stein og grus på et sorteringsverk" },
  { src: "/assets/envir/jordvaskeanlegg.jpg", alt: "Jordvaskeanlegget med plattformer og transportbånd inne i hallen" },
  { src: "/assets/news/kontrollradet-pa-besok.jpeg", alt: "Vasket, gjenvunnet singel i en arbeidshanske" },
  { src: "/assets/envir/gjenvunne-masser.jpg", alt: "Hauger av vasket sand klare for salg" },
];

export default function Transform() {
  const { quality, reducedMotion } = useQuality();
  const animated = canRender3D(quality) && !reducedMotion;

  return (
    <section id="transformasjon" aria-labelledby="transform-title" className="relative bg-night text-white">
      <Intro allowFilm={quality !== "pending" && quality !== "static" && !reducedMotion} />
      {quality === "pending" ? <div className="h-[100svh]" /> : animated ? <ScrollStory /> : <StaticStory />}
    </section>
  );
}

/** Full-bleed strip with Envir's own background film behind the section heading. */
function Intro({ allowFilm }: { allowFilm: boolean }) {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[62svh] md:h-full">
        <FilmBackdrop allowVideo={allowFilm} />
        {/* Restrained grade: darken toward the copy and melt into the section below */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,24,26,0.55)_0%,rgba(7,24,26,0.1)_28%,rgba(7,24,26,0.45)_60%,#07181a_100%)] md:bg-[linear-gradient(180deg,rgba(7,24,26,0.6)_0%,rgba(7,24,26,0.05)_28%,rgba(7,24,26,0.45)_55%,rgba(7,24,26,0.8)_80%,#07181a_100%)]"
        />
        <div aria-hidden className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(7,24,26,0.7)_0%,rgba(7,24,26,0.25)_45%,rgba(7,24,26,0)_70%)] md:block" />
      </div>
      <p className="absolute right-4 top-[calc(var(--nav-h,64px)+12px)] z-10 rounded-full bg-night/55 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-white/80 backdrop-blur-sm sm:right-6 lg:right-10">
        Film: Envir
      </p>
      <div className="relative mx-auto flex max-w-[1440px] flex-col justify-end px-4 pb-14 pt-[44svh] sm:px-6 md:min-h-[82svh] md:pb-20 md:pt-40 lg:px-10">
        <Eyebrow className="text-lime">Fra jord til ressurs</Eyebrow>
        <div className="mt-6 grid gap-6 md:gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <h2 id="transform-title" className="display text-[clamp(2.4rem,5.5vw,5rem)] text-balance [text-shadow:0_2px_24px_rgba(7,24,26,0.5)]" data-reveal>
            Slik får forurensede masser nytt liv.
          </h2>
          <p className="max-w-lg text-lg leading-relaxed text-white/80 [text-shadow:0_1px_16px_rgba(7,24,26,0.6)]" data-reveal data-reveal-delay="120">
            Fem steg gjennom jordvaskeanlegget på Laksevåg – fra lastebilen tipper i skitten sone, til rene, CE-merkede fraksjoner går tilbake til bygg- og anleggsprosjekter.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScrollStory() {
  const track = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const articles = useRef<(HTMLElement | null)[]>([]);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const darkVeil = useRef<HTMLDivElement>(null);
  const lightVeil = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const [bright, setBright] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const apply = (p: number) => {
      progress.current = p;
      const phase = storyPhase(p);
      // Copy cross-fades continuously with the camera — no threshold jumps.
      articles.current.forEach((el, i) => {
        if (!el) return;
        const d = phase - i;
        const o = Math.max(0, 1 - Math.abs(d) * 2.1);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(-d * 36).toFixed(1)}px, 0)`;
        el.style.visibility = o < 0.02 ? "hidden" : "visible";
      });
      fills.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleX(${Math.min(1, Math.max(0, phase + 1 - i)).toFixed(3)})`;
      });
      const light = storyLight(phase);
      if (darkVeil.current) darkVeil.current.style.opacity = String(1 - light);
      if (lightVeil.current) lightVeil.current.style.opacity = String(light);
      const s = Math.min(STAGES - 1, Math.round(phase));
      setStage((prev) => (prev === s ? prev : s));
      setBright((prev) => (prev === light > 0.5 ? prev : light > 0.5));
    };
    const st = ScrollTrigger.create({
      trigger: track.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    apply(st.progress);
    return () => st.kill();
  }, []);

  const jump = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const smoothScroll = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: top + (range * i) / (STAGES - 1) + 2, behavior: smoothScroll ? "smooth" : "auto" });
  };

  return (
    <div ref={track} className="relative h-[420svh] md:h-[500svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <SceneFrame
          className="absolute inset-0"
          label="Kunstnerisk 3D-visualisering av gjenvinningsprosessen i fem steg: mottak, sortering, vask og rensing, finsortering og ny bruk."
          camera={{ fov: 38, position: [-1.4, 2.7, 7.0] }}
          poster={<Image src="/assets/posters/transform.webp" alt="" fill sizes="100vw" quality={80} className="object-cover" />}
        >
          {({ quality }) => <TransformScene progress={progress} quality={quality} />}
        </SceneFrame>

        <div ref={darkVeil} aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,26,0.85)_0%,rgba(7,24,26,0.35)_40%,rgba(7,24,26,0)_65%)] max-md:bg-[linear-gradient(0deg,rgba(7,24,26,0.92)_0%,rgba(7,24,26,0.5)_45%,rgba(7,24,26,0)_70%)]" />
        <div ref={lightVeil} aria-hidden style={{ opacity: 0 }} className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(245,244,238,0.92)_0%,rgba(245,244,238,0.4)_40%,rgba(245,244,238,0)_65%)] max-md:bg-[linear-gradient(0deg,rgba(245,244,238,0.95)_0%,rgba(245,244,238,0.6)_45%,rgba(245,244,238,0)_70%)]" />

        <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-4 pb-28 sm:px-6 md:justify-center md:pb-0 lg:px-10">
          <div className="relative min-h-[300px] max-w-[30rem] md:min-h-[340px]">
            {transformStages.map((s, i) => {
              const light = i === STAGES - 1;
              return (
                <article
                  key={s.key}
                  ref={(el) => {
                    articles.current[i] = el;
                  }}
                  aria-hidden={stage !== i}
                  style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
                  className={`absolute inset-x-0 bottom-0 will-change-transform md:bottom-auto md:top-0 ${light ? "text-forest-950" : "text-white"}`}
                >
                  <p className={`eyebrow ${light ? "text-emerald-700" : "text-lime"}`}>{s.kicker}</p>
                  <h3 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)]">{s.title}</h3>
                  <p className={`mt-5 text-[1.02rem] leading-relaxed ${light ? "text-graphite/80" : "text-white/75"}`}>{s.text}</p>
                  {i === 2 && <p className="mt-4 text-sm text-white/55">Forurensningene fjernes ikke i ett enkelt trinn – de samles i slammet og håndteres videre.</p>}
                  {i === 4 && (
                    <div className="mt-6">
                      <TextLink href="/jordvaskeanlegg" className="text-forest">
                        Les om jordvaskeanlegget
                      </TextLink>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {/* Screen readers get the current step once, not five overlapping articles */}
          <p className="sr-only" aria-live="polite">
            Steg {stage + 1} av {STAGES}: {transformStages[stage].title}
          </p>
        </div>

        {/* Continuous progress — every stage reachable without scrolling the whole sequence */}
        <nav aria-label="Steg i prosessen" className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-[1440px] items-end justify-between gap-6 px-4 sm:px-6 md:bottom-10 lg:px-10">
          <ol className={`flex w-full gap-1.5 transition-colors duration-500 md:w-auto md:gap-2 ${bright ? "text-forest-950" : "text-white"}`}>
            {transformStages.map((s, i) => (
              <li key={s.key} className="flex-1 md:flex-none">
                <button type="button" onClick={() => jump(i)} aria-current={stage === i ? "step" : undefined} className="group flex w-full flex-col gap-2 py-2 text-left md:w-36">
                  <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-current/20">
                    <span
                      ref={(el) => {
                        fills.current[i] = el;
                      }}
                      className={`absolute inset-0 origin-left rounded-full ${bright ? "bg-emerald-700" : "bg-lime"}`}
                      style={{ transform: `scaleX(${i === 0 ? 1 : 0})` }}
                    />
                  </span>
                  <span className={`hidden text-xs font-medium transition-opacity md:block ${stage === i ? "opacity-100" : "opacity-60 group-hover:opacity-90"}`}>{s.title}</span>
                  <span className="sr-only md:hidden">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <a
            href="#anlegget"
            className={`shrink-0 pb-2 text-xs font-medium underline underline-offset-4 max-md:sr-only max-md:focus:not-sr-only max-md:focus:fixed max-md:focus:left-4 max-md:focus:top-[calc(var(--nav-h)+12px)] max-md:focus:z-20 max-md:focus:rounded-full max-md:focus:bg-lime max-md:focus:px-4 max-md:focus:py-2 max-md:focus:text-forest-950 max-md:focus:no-underline ${bright ? "text-forest-950/70" : "text-white/60"} hover:opacity-100`}
          >
            Hopp over animasjonen
          </a>
        </nav>
        <p className={`absolute left-4 right-4 top-[calc(var(--nav-h)+12px)] text-right text-[0.62rem] uppercase tracking-[0.16em] transition-colors duration-500 sm:left-auto sm:right-6 sm:text-[0.68rem] lg:right-10 ${bright ? "text-forest/70" : "text-white/55"}`}>
          Kunstnerisk visualisering – ikke opptak fra anlegget
        </p>
      </div>
    </div>
  );
}

function StaticStory() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-6 lg:px-10">
      <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {transformStages.map((s, i) => (
          <li key={s.key} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]" data-reveal data-reveal-delay={String(i * 80)}>
            <div className="relative aspect-[4/3]">
              <Image src={STAGE_PHOTOS[i].src} alt={STAGE_PHOTOS[i].alt} fill sizes="(min-width:1280px) 20vw, (min-width:768px) 50vw, 100vw" quality={70} className="object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-night/70 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-white/80">Foto: Envir</span>
            </div>
            <div className="p-6">
              <p className="eyebrow text-lime">{s.kicker}</p>
              <h3 className="display mt-3 text-2xl">{s.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-white/70">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
