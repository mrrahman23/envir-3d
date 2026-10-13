"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { facilityZones, type FacilityZoneId } from "@/content/site";
import SceneFrame from "@/components/three/SceneFrame";
import { canRender3D, useQuality } from "@/lib/quality";
import { ButtonLink, Eyebrow } from "@/components/ui";

const FacilityScene = dynamic(() => import("@/three/FacilityScene"), { ssr: false });

// Schematic plan positions (percent of the plan box) mirroring the 3D layout.
const PLAN: Record<FacilityZoneId, { x: number; y: number; w: number; h: number }> = {
  damp: { x: 6, y: 8, w: 18, h: 18 },
  mottak: { x: 4, y: 38, w: 22, h: 26 },
  vask: { x: 30, y: 10, w: 36, h: 46 },
  lab: { x: 70, y: 6, w: 18, h: 18 },
  lager: { x: 70, y: 30, w: 26, h: 30 },
  kai: { x: 30, y: 68, w: 50, h: 12 },
};

const subscribeFine = (cb: () => void) => {
  const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export default function Facility() {
  const { quality } = useQuality();
  const [active, setActive] = useState<FacilityZoneId>("vask");
  const [staticView, setStaticView] = useState(false);
  const finePointer = useSyncExternalStore(
    subscribeFine,
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    () => false,
  );
  const zone = facilityZones.find((z) => z.id === active)!;
  const show3D = canRender3D(quality) && !staticView;

  return (
    <section id="anlegget" aria-labelledby="facility-title" className="relative overflow-hidden bg-forest-950 py-24 text-white lg:py-32">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow className="text-lime">Anlegget på Laksevåg</Eyebrow>
            <h2 id="facility-title" className="display mt-6 text-[clamp(2.4rem,5vw,4.6rem)] text-balance" data-reveal>
              Alt under ett tak.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70" data-reveal data-reveal-delay="100">
              Mottak, jordvask, jorddamping, laboratorium, lager og egen ISPS-kai – samlet i Simonsviken, under 10 minutter fra Bergen sentrum.
            </p>
          </div>
          {canRender3D(quality) && (
            <button
              type="button"
              onClick={() => setStaticView((v) => !v)}
              aria-pressed={staticView}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              {staticView ? "Vis 3D-modell" : "Vis statisk oversikt"}
            </button>
          )}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10">
            {show3D ? (
              <SceneFrame
                className="aspect-[4/3] w-full sm:aspect-[16/10]"
                background="#0b2622"
                interactive
                alwaysRender
                label={`Illustrativ 3D-modell av Envirs anlegg. Valgt område: ${zone.label}.`}
                camera={{ fov: 32, position: [0, 9.5, 12.5] }}
                poster={<Plan active={active} onSelect={setActive} decorative />}
              >
                {(ctx) => <FacilityScene {...ctx} active={active} onSelect={setActive} controls={finePointer} />}
              </SceneFrame>
            ) : (
              <div className="aspect-[4/3] w-full bg-[#0b2622] sm:aspect-[16/10]">
                <Plan active={active} onSelect={setActive} />
              </div>
            )}
            <p className="pointer-events-none absolute bottom-3 left-4 right-4 text-[0.68rem] uppercase tracking-[0.16em] text-white/55">
              Illustrativ konseptmodell – ikke en eksakt gjengivelse av anlegget
              {show3D && finePointer ? " · Dra for å rotere" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Områder på anlegget">
              {facilityZones.map((z, i) => (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => setActive(z.id)}
                    onMouseEnter={() => finePointer && setActive(z.id)}
                    aria-pressed={active === z.id}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors duration-300 ${
                      active === z.id ? "border-lime/60 bg-lime/10" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        active === z.id ? "bg-lime text-forest-950" : "bg-white/10 text-white"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{z.label}</span>
                      <span className="hidden truncate text-xs text-white/55 lg:block">{z.short}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6" aria-live="polite">
              <p className="eyebrow text-lime">{zone.short}</p>
              <h3 className="display mt-3 text-[1.9rem]">{zone.label}</h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-white/75">{zone.text}</p>
              <div className="mt-6">
                <ButtonLink href={zone.href} tone="ghost-light" className="!px-5 !py-3 text-sm">
                  {zone.cta}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Plan({ active, onSelect, decorative }: { active: FacilityZoneId; onSelect: (id: FacilityZoneId) => void; decorative?: boolean }) {
  return (
    <div className="relative h-full w-full p-4 sm:p-8" aria-hidden={decorative}>
      <div className="relative h-full w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#24302d_0%,#24302d_78%,#0d2f36_78%)]">
        <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden>
          <defs>
            <pattern id="plan-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="white" strokeOpacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#plan-grid)" />
        </svg>
        <span className="absolute bottom-2 left-3 text-[0.65rem] uppercase tracking-widest text-sky/70">Sjøsiden · kai</span>
        {facilityZones.map((z, i) => {
          const p = PLAN[z.id];
          const on = active === z.id;
          return (
            <button
              key={z.id}
              type="button"
              tabIndex={decorative ? -1 : 0}
              onClick={() => onSelect(z.id)}
              aria-pressed={decorative ? undefined : on}
              className={`absolute flex flex-col items-start justify-between rounded-xl border p-2 text-left text-[0.7rem] transition-colors sm:p-3 sm:text-xs ${
                on ? "border-lime bg-lime/15 text-white" : "border-white/20 bg-white/[0.04] text-white/70 hover:border-white/50"
              }`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` }}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-semibold ${on ? "bg-lime text-forest-950" : "bg-white/15"}`}>{i + 1}</span>
              <span className="font-semibold leading-tight">{z.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
