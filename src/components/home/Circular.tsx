"use client";

import { useState } from "react";
import { circleStages, company, sustainability } from "@/content/site";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { useQuality } from "@/lib/quality";

const R = 230;
const C = 300;
const PATH = `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`;

export default function Circular() {
  const [active, setActive] = useState(0);
  const { reducedMotion } = useQuality();
  const stage = circleStages[active];
  return (
    <section id="baerekraft" aria-labelledby="circular-title" className="on-light relative overflow-hidden bg-paper-200 py-24 lg:py-36">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <Eyebrow className="text-emerald-700">Bærekraft</Eyebrow>
            <h2 id="circular-title" className="display mt-6 text-[clamp(2.4rem,5.4vw,5rem)] text-forest-950 text-balance" data-reveal>
              Sirkulær økonomi i praksis.
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-graphite/75 lg:justify-self-end" data-reveal data-reveal-delay="100">
            {sustainability.intro}
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Circular flow */}
          <div className="relative mx-auto w-full max-w-[600px]">
            <svg viewBox="0 0 600 600" className="h-auto w-full" aria-hidden>
              <defs>
                <radialGradient id="core" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#009a76" stopOpacity="0.18" />
                  <stop offset="1" stopColor="#009a76" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx={C} cy={C} r={R + 60} fill="url(#core)" />
              <circle cx={C} cy={C} r={R} fill="none" stroke="#004137" strokeOpacity="0.15" strokeWidth="26" />
              <circle cx={C} cy={C} r={R} fill="none" stroke="#004137" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 8" />
              {/* progress arc to the active stage */}
              <circle
                cx={C}
                cy={C}
                r={R}
                fill="none"
                stroke="#009a76"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(-90 ${C} ${C})`}
                strokeDasharray={`${(2 * Math.PI * R * (active + 0.0001)) / circleStages.length} ${2 * Math.PI * R}`}
                style={{ transition: "stroke-dasharray 0.9s var(--ease-cine)" }}
              />
              {/* Material particles travelling the loop (static positions for reduced motion) */}
              {Array.from({ length: 18 }).map((_, i) => {
                const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
                return (
                  <circle
                    key={i}
                    r={3 + (i % 3) * 1.6}
                    fill={i % 4 === 0 ? "#b9d95a" : i % 3 === 0 ? "#5b4330" : "#8c6c4e"}
                    cx={reducedMotion ? C + Math.cos(a) * R : 0}
                    cy={reducedMotion ? C + Math.sin(a) * R : 0}
                  >
                    {!reducedMotion && <animateMotion dur="22s" begin={`-${((i / 18) * 22).toFixed(2)}s`} repeatCount="indefinite" path={PATH} />}
                  </circle>
                );
              })}
              <text x={C} y={C - 14} textAnchor="middle" className="display" fontSize="44" fill="#004137">
                80 %
              </text>
              <text x={C} y={C + 18} textAnchor="middle" fontSize="15" fill="#202723" opacity="0.65">
                av massene gjenvinnes
              </text>
              <text x={C} y={C + 40} textAnchor="middle" fontSize="12" fill="#202723" opacity="0.45">
                jordvaskeanlegget
              </text>
            </svg>
            {/* Stage nodes */}
            <ol className="absolute inset-0" aria-label="Kretsløpet for masser">
              {circleStages.map((s, i) => {
                const a = (i / circleStages.length) * Math.PI * 2 - Math.PI / 2;
                const x = ((C + Math.cos(a) * R) / 600) * 100;
                const y = ((C + Math.sin(a) * R) / 600) * 100;
                const on = i === active;
                return (
                  <li key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-[0.8rem] font-semibold shadow-sm transition-all duration-300 sm:px-4 sm:text-sm ${
                        on ? "scale-105 border-forest bg-forest text-paper" : "border-forest/15 bg-white text-forest-950 hover:border-forest/40"
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] ${on ? "bg-lime text-forest-950" : "bg-forest/10"}`}>{i + 1}</span>
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div>
            <div className="rounded-[28px] bg-white p-7 shadow-[0_30px_80px_-40px_rgba(0,65,55,0.35)] sm:p-9" aria-live="polite">
              <p className="eyebrow text-emerald-700">
                Steg {active + 1} av {circleStages.length}
              </p>
              <h3 className="display mt-3 text-[2.2rem] text-forest-950">{stage.label}</h3>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-graphite/75">{stage.text}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-forest-950">LCA av Envirs jordvaskeprosess</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {sustainability.lca.map((l) => (
                  <li key={l.v} className="rounded-2xl border border-forest/10 bg-white/60 p-5">
                    <p className="display text-[2.6rem] leading-none text-forest">−{l.v} %</p>
                    <p className="mt-3 text-[0.85rem] leading-snug text-graphite/70">{l.short}</p>
                  </li>
                ))}
              </ul>
              <details className="group mt-4 text-sm text-graphite/70">
                <summary className="cursor-pointer list-none font-medium text-forest hover:underline">
                  <span className="group-open:hidden">Om analysen ▾</span>
                  <span className="hidden group-open:inline">Om analysen ▴</span>
                </summary>
                <ul className="mt-3 space-y-2">
                  {sustainability.lca.map((l) => (
                    <li key={l.v}>– {l.text}</li>
                  ))}
                </ul>
                <p className="mt-3 leading-relaxed">{sustainability.lcaMethod}</p>
              </details>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href={company.docs.lca} tone="forest">
                  Les LCA-rapporten (PDF)
                </ButtonLink>
                <ButtonLink href="/baerekraft" tone="ghost-dark">
                  Les mer om vår bærekraft
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-20 grid gap-px overflow-hidden rounded-[28px] border border-forest/10 bg-forest/10 sm:grid-cols-2 lg:grid-cols-4">
          {sustainability.frameworks.map((f, i) => (
            <li key={f.title} className="bg-paper-200 p-7" data-reveal data-reveal-delay={String(i * 80)}>
              <h3 className="display text-xl text-forest-950">{f.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-graphite/70">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
