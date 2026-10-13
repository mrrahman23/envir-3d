"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { company, hero } from "@/content/site";
import SceneFrame from "@/components/three/SceneFrame";
import FilmDialog from "@/components/FilmDialog";
import { canRender3D, useQuality } from "@/lib/quality";
import { ButtonLink, Icon } from "@/components/ui";

const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

export default function Hero() {
  const [film, setFilm] = useState(false);
  const { quality } = useQuality();
  return (
    <section aria-labelledby="hero-title" className="grain relative isolate flex min-h-[640px] flex-col overflow-hidden bg-night text-white" style={{ height: "100svh" }}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_70%_55%,#0f3d34_0%,#07181a_62%)]" />
      <SceneFrame
        eager
        transparent
        className="absolute inset-0 -z-10"
        label="3D-illustrasjon: et tverrsnitt av jord med lag av matjord, leire, sand, grus og fjell. Et gjenvinningsanlegg vokser fram på overflaten."
        camera={{ fov: 34, position: [-1.15, -0.95, 3.0] }}
        poster={
          <>
            <Image
              src="/assets/envir/fremside.webp"
              alt=""
              fill
              preload
              sizes="100vw"
              quality={70}
              className="object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,24,26,0.35)_0%,rgba(7,24,26,0.2)_40%,#07181a_100%)]" />
          </>
        }
      >
        {(ctx) => <HeroScene {...ctx} />}
      </SceneFrame>

      {/* Legibility scrim for the headline column */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(90deg,rgba(7,24,26,0.92)_0%,rgba(7,24,26,0.6)_38%,rgba(7,24,26,0)_70%)] max-lg:bg-[linear-gradient(180deg,rgba(7,24,26,0.1)_0%,rgba(7,24,26,0.75)_55%,rgba(7,24,26,0.95)_100%)]" />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-end px-4 pb-24 pt-[calc(var(--nav-h)+2rem)] sm:px-6 sm:pb-28 lg:justify-center lg:px-10 lg:pb-16">
        <div className="max-w-[40rem] xl:max-w-[44rem]">
          <p className="hero-in eyebrow flex items-center gap-3 text-lime" style={{ animationDelay: "0.2s" }}>
            <span aria-hidden className="inline-block h-px w-8 bg-current" />
            Gjenvinning av jord og gravemasser · Bergen
          </p>
          <h1 id="hero-title" className="display hero-rise mt-6 text-[clamp(2.6rem,5.6vw,5.4rem)] text-balance" style={{ animationDelay: "0.35s" }}>
            {hero.title}
          </h1>
          <p className="hero-in mt-6 max-w-[36rem] text-[1.075rem] leading-relaxed text-white/75 sm:text-[1.2rem]" style={{ animationDelay: "0.6s" }}>
            {hero.lead}
          </p>
          <div className="hero-in mt-9 flex flex-wrap gap-3" style={{ animationDelay: "0.8s" }}>
            <ButtonLink href="/mottak">Lever masser</ButtonLink>
            <ButtonLink href="/gjenvunne-masser" tone="ghost-light">
              Kjøp gjenvunne masser
            </ButtonLink>
          </div>
          {/* Verified key figures (envir.com) — the business case in the first seconds */}
          <dl className="hero-in mt-10 grid max-w-[34rem] grid-cols-3 gap-4 border-t border-white/12 pt-6 max-sm:hidden" style={{ animationDelay: "1s" }}>
            {[
              { v: "80 %", l: "av massene gjenvinnes" },
              { v: "150 000+", l: "tonn mottakskapasitet i året" },
              { v: "< 10 min", l: "fra Bergen sentrum" },
            ].map((f) => (
              <div key={f.l}>
                <dt className="sr-only">{f.l}</dt>
                <dd className="display text-[1.55rem] leading-none text-white">{f.v}</dd>
                <dd className="mt-2 text-[0.8rem] leading-snug text-white/60">{f.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] items-end justify-between gap-6 px-4 pb-7 sm:px-6 lg:px-10">
        <p className="hero-in display text-[1.05rem] font-medium tracking-tight text-white/85" style={{ animationDelay: "1.1s" }}>
          {hero.caption}
        </p>
        <a href="#transformasjon" className="group absolute left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-white/55 hover:text-white md:flex">
          Scroll
          <span aria-hidden className="scroll-cue relative block h-12 w-px overflow-hidden bg-white/20" />
        </a>
        <button
          type="button"
          onClick={() => setFilm(true)}
          className="hero-in group inline-flex items-center gap-3 text-sm text-white/80 hover:text-white"
          style={{ animationDelay: "1.2s" }}
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition-colors group-hover:border-lime group-hover:text-lime">
            <Icon name="play" className="h-3.5 w-3.5 translate-x-px" />
          </span>
          <span className="hidden sm:inline">Se presentasjonsfilmen</span>
          <span className="sm:hidden">Film</span>
        </button>
      </div>
      {/* Seamless hand-off into the transformation sequence */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-[4] h-40 bg-[linear-gradient(180deg,rgba(7,24,26,0)_0%,#07181a_100%)]" />
      <p className="absolute right-4 top-[calc(var(--nav-h)+12px)] text-[0.68rem] uppercase tracking-[0.18em] text-white/55 sm:right-6 lg:right-10">
        {canRender3D(quality) ? "3D-illustrasjon" : "Foto: Envir"}
      </p>

      <FilmDialog open={film} onClose={() => setFilm(false)} src={company.film} title="Envir presentasjonsfilm" />
    </section>
  );
}
