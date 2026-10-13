"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { transformStages } from "@/content/site";
import SceneFrame from "@/components/three/SceneFrame";
import { canRender3D, useQuality } from "@/lib/quality";
import { Eyebrow, TextLink } from "@/components/ui";

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
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-24 sm:px-6 lg:px-10 lg:pt-32">
        <Eyebrow className="text-lime">Fra jord til ressurs</Eyebrow>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <h2 id="transform-title" className="display text-[clamp(2.4rem,5.5vw,5rem)] text-balance" data-reveal>
            Slik får forurensede masser nytt liv.
          </h2>
          <p className="max-w-lg text-lg leading-relaxed text-white/70" data-reveal data-reveal-delay="120">
            Fem steg gjennom jordvaskeanlegget på Laksevåg – fra lastebilen tipper i skitten sone, til rene, CE-merkede fraksjoner går tilbake til bygg- og anleggsprosjekter.
          </p>
        </div>
      </div>
      {quality === "pending" ? <div className="h-[100svh]" /> : animated ? <ScrollStory /> : <StaticStory />}
    </section>
  );
}

function ScrollStory() {
  const track = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: track.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.current = self.progress;
        const s = Math.min(transformStages.length - 1, Math.round(self.progress * (transformStages.length - 1)));
        setStage((prev) => (prev === s ? prev : s));
      },
    });
    return () => st.kill();
  }, []);

  const jump = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (range * i) / (transformStages.length - 1) + 2, behavior: "smooth" });
  };

  return (
    <div ref={track} className="relative" style={{ height: `${transformStages.length * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <SceneFrame
          className="absolute inset-0"
          label="Kunstnerisk 3D-visualisering av gjenvinningsprosessen i fem steg: mottak, sortering, vask og rensing, finsortering og ny bruk."
          camera={{ fov: 38, position: [-2.6, 1.9, 4.6] }}
          poster={<div className="absolute inset-0 bg-night" />}
        >
          {({ quality }) => <TransformScene progress={progress} quality={quality} />}
        </SceneFrame>

        <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${stage === 4 ? "opacity-0" : "opacity-100"} bg-[linear-gradient(90deg,rgba(7,24,26,0.85)_0%,rgba(7,24,26,0.35)_40%,rgba(7,24,26,0)_65%)] max-md:bg-[linear-gradient(0deg,rgba(7,24,26,0.92)_0%,rgba(7,24,26,0.5)_45%,rgba(7,24,26,0)_70%)]`} />
        <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${stage === 4 ? "opacity-100" : "opacity-0"} bg-[linear-gradient(90deg,rgba(245,244,238,0.92)_0%,rgba(245,244,238,0.4)_40%,rgba(245,244,238,0)_65%)] max-md:bg-[linear-gradient(0deg,rgba(245,244,238,0.95)_0%,rgba(245,244,238,0.6)_45%,rgba(245,244,238,0)_70%)]`} />

        <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-end px-4 pb-28 sm:px-6 md:justify-center md:pb-0 lg:px-10">
          <div className="relative min-h-[300px] max-w-[30rem] md:min-h-[340px]" aria-live="polite">
            {transformStages.map((s, i) => (
              <article
                key={s.key}
                aria-hidden={stage !== i}
                className={`absolute inset-x-0 bottom-0 transition-all duration-700 ease-[var(--ease-cine)] md:bottom-auto md:top-0 ${
                  stage === i ? "translate-y-0 opacity-100" : i < stage ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"
                } ${stage === 4 ? "text-forest-950" : "text-white"}`}
              >
                <p className={`eyebrow ${stage === 4 ? "text-emerald-700" : "text-lime"}`}>{s.kicker}</p>
                <h3 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)]">{s.title}</h3>
                <p className={`mt-5 text-[1.02rem] leading-relaxed ${stage === 4 ? "text-graphite/80" : "text-white/75"}`}>{s.text}</p>
                {i === 2 && (
                  <p className={`mt-4 text-sm ${stage === 4 ? "text-graphite/70" : "text-white/50"}`}>
                    Forurensningene fjernes ikke i ett enkelt trinn – de samles i slammet og håndteres videre.
                  </p>
                )}
                {i === 4 && (
                  <div className="mt-6">
                    <TextLink href="/jordvaskeanlegg" className="text-forest">
                      Les om jordvaskeanlegget
                    </TextLink>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Stepper — every stage reachable without scrolling the whole sequence */}
        <nav aria-label="Steg i prosessen" className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-[1440px] px-4 sm:px-6 md:bottom-10 lg:px-10">
          <ol className={`flex w-full gap-1.5 md:w-auto md:gap-2 ${stage === 4 ? "text-forest-950" : "text-white"}`}>
            {transformStages.map((s, i) => (
              <li key={s.key} className="flex-1 md:flex-none">
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={stage === i ? "step" : undefined}
                  className="group flex w-full flex-col gap-2 text-left md:w-36"
                >
                  <span className={`block h-[3px] w-full rounded-full transition-colors duration-500 ${stage >= i ? (stage === 4 ? "bg-emerald" : "bg-lime") : "bg-current opacity-20"}`} />
                  <span className={`hidden text-xs font-medium transition-opacity md:block ${stage === i ? "opacity-100" : "opacity-55 group-hover:opacity-90"}`}>{s.title}</span>
                  <span className="sr-only md:hidden">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <p className={`absolute left-4 right-4 top-[calc(var(--nav-h)+12px)] text-right text-[0.62rem] uppercase tracking-[0.16em] sm:left-auto sm:right-6 sm:text-[0.68rem] lg:right-10 ${stage === 4 ? "text-forest/70" : "text-white/55"}`}>
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
