"use client";

import { useEffect, useRef, useState } from "react";
import { company, metrics, sustainability } from "@/content/site";
import { Eyebrow } from "@/components/ui";

const nf = new Intl.NumberFormat("nb-NO");

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView] as const;
}

/** Final value is always in the markup; counts up once when first seen (skipped for reduced motion). */
function CountUp({ value, prefix = "", suffix = "", start }: { value: number; prefix?: string; suffix?: string; start: boolean }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    if (!start || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const dur = 1600;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      setN(k >= 1 ? null : Math.round(value * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value]);
  return (
    <span className="tabular-nums">
      {prefix}
      {nf.format(n ?? value)}
      {suffix}
    </span>
  );
}

export default function Impact() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [recovery, capacity, fractions, quay, distance] = metrics;
  return (
    <section aria-labelledby="impact-title" className="grain relative overflow-hidden bg-night py-24 text-white lg:py-36">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-emerald/15 blur-[140px]" />
      <div ref={ref} className={`relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 ${inView ? "is-live" : ""}`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="text-lime">Nøkkeltall</Eyebrow>
            <h2 id="impact-title" className="display mt-6 max-w-3xl text-[clamp(2.4rem,5vw,4.6rem)] text-balance" data-reveal>
              Et av verdens mest komplette anlegg – i tall.
            </h2>
          </div>
          <p className="max-w-xs text-sm text-white/60">Publiserte nøkkeltall fra Envir. Ikke sanntidsmålinger fra driften.</p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 lg:grid-cols-6">
          {/* 80 % */}
          <article className="bg-night p-7 sm:p-10 lg:col-span-4">
            <p className="eyebrow text-white/50">{recovery.label}</p>
            <p className="display mt-4 text-[clamp(5rem,15vw,13rem)] leading-[0.85] text-lime">
              <CountUp value={recovery.value} suffix={recovery.suffix} start={inView} />
            </p>
            <p className="mt-6 max-w-lg text-white/70">{recovery.text}</p>
            <Source>Envir, jordvaskeanlegget · andel av mottatte masser som gjenvinnes</Source>
            <StreamSplit live={inView} />
          </article>

          {/* 150 000 t */}
          <article className="bg-night p-7 sm:p-10 lg:col-span-2">
            <p className="eyebrow text-white/50">{capacity.label}</p>
            <p className="display mt-4 text-[clamp(2.6rem,5vw,4.4rem)] leading-none">
              <span className="text-white/60">&gt; </span>
              <CountUp value={capacity.value} suffix={capacity.suffix} start={inView} />
            </p>
            <PileGrow live={inView} />
            <p className="mt-4 text-[0.95rem] text-white/65">{capacity.text}</p>
            <Source>Envir · anleggets kapasitet, ikke årlig mottatt mengde</Source>
          </article>

          {/* 0,01–90 mm */}
          <article className="bg-night p-7 sm:p-10 lg:col-span-3">
            <p className="eyebrow text-white/50">{fractions.label}</p>
            <p className="display mt-4 text-[clamp(2.6rem,5vw,4.4rem)] leading-none">{fractions.display}</p>
            <ScaleBar />
            <p className="mt-4 text-[0.95rem] text-white/65">{fractions.text}</p>
            <Source>Envir · se produktene for faktiske fraksjoner og priser</Source>
          </article>

          {/* 5000 t */}
          <article className="bg-night p-7 sm:p-10 lg:col-span-3">
            <p className="eyebrow text-white/50">{quay.label}</p>
            <p className="display mt-4 text-[clamp(2.6rem,5vw,4.4rem)] leading-none">
              <CountUp value={quay.value} suffix={quay.suffix} start={inView} />
            </p>
            <QuayShip />
            <p className="mt-4 text-[0.95rem] text-white/65">{quay.text}</p>
            <Source>Envir · ISPS-kai, båtstørrelse i tonn</Source>
          </article>

          {/* < 10 min */}
          <article className="bg-night p-7 sm:p-10 lg:col-span-6 lg:flex lg:items-center lg:gap-16">
            <div className="lg:w-1/3">
              <p className="eyebrow text-white/50">{distance.label}</p>
              <p className="display mt-4 text-[clamp(2.6rem,5vw,4.4rem)] leading-none">
                &lt;
                <CountUp value={distance.value} suffix={distance.suffix} start={inView} />
              </p>
            </div>
            <div className="mt-6 flex-1 lg:mt-0">
              <Route />
              <p className="mt-4 max-w-2xl text-[0.95rem] text-white/65">{distance.text}</p>
              <Source>Envir · Sjøkrigsskoleveien 15, Laksevåg</Source>
            </div>
          </article>
        </div>

        {/* Documented climate effect — kept apart from operational figures, with method and source */}
        <div className="mt-6 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 lg:grid-cols-[1.1fr_repeat(3,1fr)]">
          <div className="bg-night p-7 sm:p-10">
            <p className="eyebrow text-lime">Livsløpsanalyse (LCA)</p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-white/70">
              Reduksjon i klimagassutslipp (kg CO₂-ekv.) for Envirs jordvaskeprosess, sammenlignet med deponering og jomfruelige materialer.
            </p>
            <Source>
              NORSUS, april 2026 · ISO 14040/14044 og EN 15804 · transport fra anlegget er ikke inkludert ·{" "}
              <a href={company.docs.lca} className="underline underline-offset-2 hover:text-white">
                LCA-rapporten (PDF)
              </a>
            </Source>
          </div>
          {sustainability.lca.map((l) => (
            <div key={l.v} className="bg-night p-7 sm:p-10">
              <p className="display text-[clamp(2.6rem,4vw,3.6rem)] leading-none text-white">
                −{l.v}
                <span className="ml-1 text-[0.5em] text-white/60">%</span>
              </p>
              <p className="mt-4 text-[0.92rem] leading-snug text-white/70">{l.short}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Source({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 border-t border-white/10 pt-4 text-[0.75rem] leading-relaxed text-white/55">Kilde: {children}</p>;
}

function StreamSplit({ live }: { live: boolean }) {
  return (
    <figure className="mt-10" aria-label="80 prosent av massene gjenvinnes, 20 prosent gjenstår">
      <svg viewBox="0 0 600 120" className="h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id="soil" x1="0" x2="1">
            <stop offset="0" stopColor="#5b4330" />
            <stop offset="1" stopColor="#8c6c4e" />
          </linearGradient>
        </defs>
        <path d="M0 40 H200 C260 40 270 20 330 20 H600 V70 H330 C270 70 260 60 200 60 H0 Z" fill="url(#soil)" opacity="0.35" />
        <path
          d="M200 40 C260 40 270 20 330 20 H600 V68 H330 C280 68 260 58 200 58 Z"
          fill="#b9d95a"
          style={{ clipPath: live ? "inset(0 0 0 0)" : "inset(0 100% 0 0)", transition: "clip-path 1.8s var(--ease-cine) .2s" }}
        />
        <path
          d="M200 58 C260 58 270 92 330 92 H600 V104 H330 C280 104 260 62 200 62 Z"
          fill="#8c918a"
          style={{ clipPath: live ? "inset(0 0 0 0)" : "inset(0 100% 0 0)", transition: "clip-path 1.8s var(--ease-cine) .4s" }}
        />
        <rect x="0" y="40" width="200" height="22" fill="#5b4330" />
        <text x="0" y="30" fill="currentColor" opacity="0.6" fontSize="13">Mottatte masser</text>
        <text x="600" y="12" textAnchor="end" fill="#b9d95a" fontSize="13">Gjenvunnet · 80 %</text>
        <text x="600" y="120" textAnchor="end" fill="currentColor" opacity="0.55" fontSize="13">Øvrig · 20 %</text>
      </svg>
    </figure>
  );
}

function PileGrow({ live }: { live: boolean }) {
  return (
    <svg viewBox="0 0 300 120" className="mt-6 h-auto w-full" aria-hidden>
      <line x1="0" y1="112" x2="300" y2="112" stroke="currentColor" strokeOpacity="0.2" />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${30 + i * 85} 112 L${80 + i * 85} ${40 - i * 8} L${130 + i * 85} 112 Z`}
          fill={["#6f6c66", "#8e8a83", "#c2a77d"][i]}
          style={{
            transformOrigin: `${80 + i * 85}px 112px`,
            transform: live ? "scaleY(1)" : "scaleY(0.05)",
            transition: `transform 1.6s var(--ease-cine) ${0.2 + i * 0.18}s`,
          }}
        />
      ))}
    </svg>
  );
}

function ScaleBar() {
  // log10 positions from 0.01 mm to 90 mm
  const ticks = [0.01, 0.1, 2, 8, 16, 32, 64, 90];
  const pos = (v: number) => Math.round(((Math.log10(v) + 2) / (Math.log10(90) + 2)) * 10000) / 100;
  return (
    <figure className="mt-8" aria-label="Logaritmisk skala over fraksjoner fra 0,01 til 90 millimeter">
      <div className="relative h-16" aria-hidden>
        <div className="absolute inset-x-0 top-8 h-px bg-white/20" />
        {ticks.map((t) => (
          <div key={t} className="absolute top-8 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos(t)}%` }}>
            <span className="block rounded-full bg-[#b9a27c]" style={{ width: Math.round(4 + pos(t) * 0.26), height: Math.round(4 + pos(t) * 0.26), opacity: Math.round((0.55 + pos(t) / 250) * 100) / 100 }} />
          </div>
        ))}
        {ticks.map((t) => (
          <span key={`l${t}`} className="absolute top-[3.25rem] -translate-x-1/2 text-[0.65rem] tabular-nums text-white/55" style={{ left: `${pos(t)}%` }}>
            {String(t).replace(".", ",")}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 text-[0.65rem] uppercase tracking-widest text-white/55">mm · logaritmisk skala</figcaption>
    </figure>
  );
}

function QuayShip() {
  return (
    <svg viewBox="0 0 400 90" className="mt-6 h-auto w-full" aria-hidden>
      <rect x="0" y="62" width="400" height="28" fill="#0d2f36" />
      <rect x="0" y="54" width="400" height="8" fill="#5f6766" />
      {[40, 120, 200, 280, 360].map((x) => (
        <rect key={x} x={x} y="48" width="5" height="7" fill="#2a2d2c" />
      ))}
      <g className="motion-safe:animate-[ship_14s_ease-in-out_infinite_alternate]">
        <path d="M60 64 H280 Q300 64 306 76 H64 Z" fill="#21343a" />
        <rect x="74" y="44" width="34" height="20" fill="#e9ebe6" />
        <rect x="130" y="52" width="140" height="12" fill="#3b4744" />
        <path d="M150 52 Q190 36 230 52 Z" fill="#a99a7f" />
      </g>
    </svg>
  );
}

function Route() {
  return (
    <svg viewBox="0 0 600 70" className="h-auto w-full" aria-label="Rute fra Bergen sentrum til Envir på Laksevåg">
      <path id="route" d="M20 45 C140 10 260 60 360 30 S520 20 580 40" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 6" />
      <circle cx="20" cy="45" r="6" fill="#96d7e8" />
      <circle cx="580" cy="40" r="7" fill="#b9d95a" />
      <circle r="4" fill="#fff" className="motion-reduce:hidden">
        <animateMotion dur="6s" repeatCount="indefinite" path="M20 45 C140 10 260 60 360 30 S520 20 580 40" />
      </circle>
      <text x="20" y="68" fill="currentColor" opacity="0.6" fontSize="13">Bergen sentrum</text>
      <text x="580" y="68" textAnchor="end" fill="#b9d95a" fontSize="13">Envir, Laksevåg</text>
    </svg>
  );
}
