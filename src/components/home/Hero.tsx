"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { company, hero } from "@/content/site";
import SceneFrame from "@/components/three/SceneFrame";
import FilmDialog from "@/components/FilmDialog";
import { canRender3D, useQuality } from "@/lib/quality";
import { ButtonLink, Icon } from "@/components/ui";
import { AerialStill, GlobePoster } from "./hero/posters";
import StaticStrata from "./hero/StaticStrata";
import { GeologyHeading, GeologyList, FINAL_LINE } from "./hero/GeologyCopy";
import { clamp01, createStory, creditIndex, dipAmount, finalCopy, geoCopy, heroCopy, P } from "@/three/earth/timeline";

const EarthStoryScene = dynamic(() => import("@/three/earth/EarthStoryScene"), { ssr: false });

const SCENE_LABEL =
  "Animert 3D-visualisering basert på satellittdata: jordkloden sett fra verdensrommet, en flytur inn over Vestlandet til Bergen og ned mot Laksevåg, og deretter et skjematisk tverrsnitt av jordlagene matjord, sand, grus, mineralmasse og berggrunn som løftes fra hverandre.";

/** One hero per page: the story state is a plain mutable object shared with the scene. */
const story = createStory();

/** Short forms on phones; full attribution is also in the footer. */
const CREDITS = [
  { full: "Satellittbilde: NASA Blue Marble", short: "Satellitt: NASA" },
  { full: "Inneholder modifiserte Copernicus Sentinel-2-data (2020) · Høydedata: Copernicus DEM", short: "Copernicus Sentinel-2 · DEM" },
  { full: "Skjematisk 3D-visualisering · Skann: Poly Haven (CC0)", short: "Skjematisk 3D · Poly Haven" },
];

export default function Hero() {
  const [film, setFilm] = useState(false);
  const { quality, reducedMotion } = useQuality();
  // Pending (SSR + first paint) renders the track so the common case never shifts.
  const live = quality === "pending" || (canRender3D(quality) && !reducedMotion);
  return (
    <section aria-labelledby="hero-title" className="relative isolate bg-night text-white">
      <a
        href="#transformasjon"
        className="sr-only z-50 rounded-full bg-lime px-4 py-2 text-sm font-medium text-forest-950 focus:not-sr-only focus:absolute focus:left-4 focus:top-[calc(var(--nav-h)+12px)]"
      >
        Hopp over<span className="sr-only"> introduksjonen</span>
      </a>
      {live ? <StoryTrack onFilm={() => setFilm(true)} /> : <StillHero onFilm={() => setFilm(true)} />}
      <FilmDialog open={film} onClose={() => setFilm(false)} src={company.film} title="Envir presentasjonsfilm" />
    </section>
  );
}

// ---------------------------------------------------------------------------

/** Pinned scroll track: intro flight → descent → soil profile. All DOM state is written imperatively. */
function StoryTrack({ onFilm }: { onFilm: () => void }) {
  const { quality } = useQuality();
  const track = useRef<HTMLDivElement>(null);
  const heroLayer = useRef<HTMLDivElement>(null);
  const heroScrim = useRef<HTMLDivElement>(null);
  const geoLayer = useRef<HTMLDivElement>(null);
  const geoScrim = useRef<HTMLDivElement>(null);
  const final = useRef<HTMLParagraphElement>(null);
  const dip = useRef<HTMLDivElement>(null);
  const strata = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const credits = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let credit = -1;
    const set = (el: HTMLElement | null, o: number, y = 0, hide = false) => {
      if (!el) return;
      el.style.opacity = o.toFixed(3);
      if (y) el.style.transform = `translate3d(0, ${((1 - o) * y).toFixed(1)}px, 0)`;
      if (hide) el.style.visibility = o < 0.01 ? "hidden" : "visible";
    };
    const applyCredits = () => {
      const c = creditIndex(story.intro, story.scroll);
      if (c === credit) return;
      credit = c;
      credits.current.forEach((el, i) => el && (el.style.opacity = i === c ? "1" : "0"));
    };
    const apply = () => {
      raf = 0;
      const el = track.current;
      if (!el) return;
      const range = el.offsetHeight - window.innerHeight;
      const p = clamp01(-el.getBoundingClientRect().top / Math.max(1, range));
      story.scroll = p;
      const h = heroCopy(p);
      set(heroLayer.current, h, 0, true);
      if (heroLayer.current) heroLayer.current.style.transform = `translate3d(0, ${(-(1 - h) * 48).toFixed(1)}px, 0)`;
      set(heroScrim.current, h);
      const g = geoCopy(p);
      set(geoLayer.current, g, 28);
      set(geoScrim.current, g);
      set(final.current, finalCopy(p), 18);
      const d = dipAmount(p);
      set(dip.current, d);
      // A short push through the surface: the frame drifts in as it darkens, and settles out of it.
      if (scene.current) scene.current.style.transform = d > 0.001 ? `scale(${(1 + (p < P.cutaway ? 0.07 : 0.035) * d).toFixed(4)})` : "";
      if (strata.current) {
        // Fallback strata under the canvas: kept out of layout (no background downloads) until the
        // descent, and only while SceneFrame shows its poster layer (3D pending/failed/offscreen).
        const posterHidden = strata.current.parentElement?.classList.contains("opacity-0");
        strata.current.style.display = p > 0.12 && !posterHidden ? "flex" : "";
        strata.current.style.opacity = p >= P.cutaway ? "1" : "0";
      }
      applyCredits();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    story.listeners.add(applyCredits);
    apply();
    // Re-apply when SceneFrame swaps between canvas and poster (e.g. WebGL context lost mid-story).
    const posterLayer = strata.current?.parentElement;
    const mo = new MutationObserver(onScroll);
    if (posterLayer) mo.observe(posterLayer, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      story.listeners.delete(applyCredits);
      mo.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={track} className="relative h-[340svh] md:h-[380svh]">
      {/* Anchor for the "Scroll" cue: lands on the closed soil profile. */}
      <div id="under-overflaten" aria-hidden className="pointer-events-none absolute left-0 top-[calc((340svh-100svh)*0.52)] h-px w-px md:top-[calc((380svh-100svh)*0.52)]" />
      <div className="grain sticky top-0 isolate h-[100svh] min-h-[600px] overflow-hidden">
        <div ref={scene} className="absolute inset-0 -z-10">
        <SceneFrame
          eager
          deferMs={quality === "low" ? 8000 : undefined}
          shadows
          className="absolute inset-0"
          label={SCENE_LABEL}
          camera={{ fov: 35, position: [0, 0, 20000], near: 1, far: 50000 }}
          poster={
            <>
              <GlobePoster />
              <div ref={strata} aria-hidden className="absolute inset-0 hidden items-center bg-night opacity-0">
                <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
                  <StaticStrata labelled={false} className="ml-auto w-full max-w-[34rem] max-lg:mx-auto max-lg:mb-[34svh] max-lg:max-w-[22rem]" />
                </div>
              </div>
            </>
          }
        >
          {(ctx) => <EarthStoryScene quality={ctx.quality} story={story} />}
        </SceneFrame>
        </div>

        {/* Dissolve through the ground into the soil profile */}
        <div ref={dip} aria-hidden className="pointer-events-none absolute inset-0 -z-[6] bg-[radial-gradient(120%_90%_at_50%_40%,#1c150e_0%,#0e0b08_70%)] opacity-0" />

        {/* Legibility scrims (kept off the subject) */}
        <div aria-hidden data-scene-scrim className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-40 bg-[linear-gradient(180deg,rgba(7,24,26,0.55)_0%,rgba(7,24,26,0)_100%)]" />
        <div
          ref={heroScrim}
          aria-hidden
          data-scene-scrim
          className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(90deg,rgba(7,24,26,0.9)_0%,rgba(7,24,26,0.62)_34%,rgba(7,24,26,0)_62%)] max-lg:bg-[linear-gradient(180deg,rgba(7,24,26,0)_30%,rgba(7,24,26,0.78)_58%,rgba(7,24,26,0.96)_100%)]"
        />
        <div
          ref={geoScrim}
          aria-hidden
          data-scene-scrim
          className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(90deg,rgba(7,24,26,0.75)_0%,rgba(7,24,26,0.35)_32%,rgba(7,24,26,0)_52%)] opacity-0 max-lg:bg-[linear-gradient(180deg,rgba(7,24,26,0)_48%,rgba(7,24,26,0.85)_68%,rgba(7,24,26,0.97)_100%)]"
        />

        {/* Hero copy: first viewport of the track */}
        <div ref={heroLayer} data-scene-overlay className="absolute inset-0 flex flex-col">
          <HeroCopy />
          <HeroBar onFilm={onFilm} scrollHref="#under-overflaten" />
        </div>

        {/* Geology copy */}
        <div ref={geoLayer} data-scene-overlay className="pointer-events-none absolute inset-0 flex opacity-0">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col justify-end px-4 pb-10 pt-[calc(var(--nav-h)+2rem)] sm:px-6 lg:justify-center lg:px-10 lg:pb-16">
            <div className="max-w-[30rem]">
              <GeologyHeading />
              <GeologyList className="sr-only" />
              <p ref={final} className="display mt-6 max-w-[26rem] text-[1.15rem] leading-[1.3]! tracking-[-0.02em]! text-white opacity-0 sm:text-[1.35rem]">
                {FINAL_LINE}
              </p>
              <p className="mt-5 text-[0.62rem] uppercase leading-relaxed tracking-[0.16em] text-white/75 lg:absolute lg:bottom-8 lg:right-10 lg:mt-0">
                Skjematisk jordprofil – ikke i målestokk
              </p>
            </div>
          </div>
        </div>

        {/* Credits follow the imagery on screen */}
        <p data-scene-overlay className="pointer-events-none absolute right-4 top-[calc(var(--nav-h)+12px)] w-[13rem] text-right text-[0.62rem] uppercase leading-relaxed tracking-[0.16em] text-white/85 sm:right-6 sm:w-[30rem] lg:right-10 lg:w-[46rem]">
          {CREDITS.map((c, i) => (
            <span
              key={c.full}
              ref={(el) => {
                credits.current[i] = el;
              }}
              className={`rounded-[3px] bg-night/70 px-2 py-1 transition-opacity duration-700 ${i === 0 ? "relative inline-block" : "absolute right-0 top-0 w-max max-w-full"}`}
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <span className="sm:hidden">{c.short}</span>
              <span className="max-sm:hidden">{c.full}</span>
            </span>
          ))}
        </p>

        {/* Seamless hand-off into the transformation sequence */}
        <div aria-hidden data-scene-scrim className="pointer-events-none absolute inset-x-0 bottom-0 -z-[4] h-24 bg-[linear-gradient(180deg,rgba(7,24,26,0)_0%,#07181a_100%)]" />
      </div>
    </div>
  );
}

/** Reduced motion / no WebGL: a still aerial and an in-flow static soil profile — no pinning. */
function StillHero({ onFilm }: { onFilm: () => void }) {
  return (
    <>
      <div className="grain relative isolate flex h-[100svh] min-h-[640px] flex-col overflow-hidden">
        <AerialStill />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-40 bg-[linear-gradient(180deg,rgba(7,24,26,0.55)_0%,rgba(7,24,26,0)_100%)]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-[5] bg-[linear-gradient(90deg,rgba(7,24,26,0.9)_0%,rgba(7,24,26,0.62)_34%,rgba(7,24,26,0)_62%)] max-lg:bg-[linear-gradient(180deg,rgba(7,24,26,0)_30%,rgba(7,24,26,0.78)_58%,rgba(7,24,26,0.96)_100%)]"
        />
        <HeroCopy />
        <HeroBar onFilm={onFilm} scrollHref="#under-overflaten" />
        <p className="absolute right-4 top-[calc(var(--nav-h)+12px)] max-w-[17rem] text-right text-[0.62rem] uppercase leading-relaxed tracking-[0.16em] text-white/85 sm:right-6 sm:max-w-[30rem] lg:right-10 lg:max-w-[46rem]">
          <span className="inline-block rounded-[3px] bg-night/70 px-2 py-1">{CREDITS[1].full} · 3D-gjengivelse</span>
        </p>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-[4] h-24 bg-[linear-gradient(180deg,rgba(7,24,26,0)_0%,#07181a_100%)]" />
      </div>
      <div id="under-overflaten" className="relative mx-auto grid max-w-[1440px] gap-12 px-4 pb-28 pt-16 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20 lg:px-10 lg:pb-36 lg:pt-24">
        <div className="max-w-[30rem]">
          <GeologyHeading />
          <p className="display mt-8 max-w-[26rem] text-[1.15rem] leading-[1.3]! tracking-[-0.02em]! text-white sm:text-[1.35rem]">{FINAL_LINE}</p>
        </div>
        <StaticStrata className="w-full max-w-[36rem] lg:justify-self-end" />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function HeroCopy() {
  return (
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
  );
}

function HeroBar({ onFilm, scrollHref }: { onFilm: () => void; scrollHref: string }) {
  return (
    <div className="relative mx-auto flex w-full max-w-[1440px] items-end justify-between gap-6 px-4 pb-7 sm:px-6 lg:px-10">
      <p className="hero-in display text-[1.05rem] font-medium tracking-tight text-white/85" style={{ animationDelay: "1.1s" }}>
        {hero.caption}
      </p>
      <a href={scrollHref} className="group absolute isolate left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-white [text-shadow:0_1px_8px_rgba(7,24,26,0.95)] before:pointer-events-none before:absolute before:-inset-x-8 before:-inset-y-4 before:-z-10 before:bg-[radial-gradient(closest-side,rgba(7,24,26,0.7),rgba(7,24,26,0))] hover:text-white md:flex">
        Scroll
        <span aria-hidden className="scroll-cue relative block h-12 w-px overflow-hidden bg-white/20" />
      </a>
      <button type="button" onClick={onFilm} className="hero-in group inline-flex items-center gap-3 text-sm text-white/80 hover:text-white" style={{ animationDelay: "1.2s" }}>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition-colors group-hover:border-lime group-hover:text-lime">
          <Icon name="play" className="h-3.5 w-3.5 translate-x-px" />
        </span>
        <span className="hidden sm:inline">Se presentasjonsfilmen</span>
        <span className="sm:hidden">Film</span>
      </button>
    </div>
  );
}
