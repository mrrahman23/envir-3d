"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useDeferredValue, useState } from "react";
import { priceNote, products, services } from "@/content/site";
import SceneFrame from "@/components/three/SceneFrame";
import { ButtonLink, Eyebrow } from "@/components/ui";

const Reception = dynamic(() => import("@/three/ServiceScenes").then((m) => m.ReceptionScene), { ssr: false });
const Materials = dynamic(() => import("@/three/ServiceScenes").then((m) => m.MaterialsScene), { ssr: false });
const Wash = dynamic(() => import("@/three/ServiceScenes").then((m) => m.WashScene), { ssr: false });
const Lab = dynamic(() => import("@/three/ServiceScenes").then((m) => m.LabScene), { ssr: false });

// Fractions shown in the carousel (order matches SAMPLES in ServiceScenes).
const CAROUSEL = ["0-2", "2-8", "8-16", "16-32", "32-64", "64-90"] as const;

function Poster({ src, alt, dim = true }: { src: string; alt: string; dim?: boolean }) {
  return (
    <>
      <Image src={src} alt={alt} fill sizes="(min-width:1024px) 55vw, 100vw" quality={70} className="object-cover" />
      {dim && <div className="absolute inset-0 bg-night/30" />}
    </>
  );
}

export default function Services() {
  const [fraction, setFraction] = useState(3);
  // Carousel rotation follows in a deferred render; the selected chip and price card update first.
  const sceneFraction = useDeferredValue(fraction);
  const product = products.find((p) => p.id === CAROUSEL[fraction])!;
  const [a, b, c, d] = services;

  return (
    <section id="tjenester" aria-labelledby="services-title" className="on-light relative bg-paper py-24 lg:py-36">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Eyebrow className="text-emerald-700">Tjenester</Eyebrow>
            <h2 id="services-title" className="display mt-6 text-[clamp(2.6rem,6vw,5.6rem)] text-forest-950" data-reveal>
              Hva vi tilbyr
            </h2>
          </div>
          <p className="max-w-lg text-lg leading-relaxed text-graphite/70 lg:justify-self-end" data-reveal data-reveal-delay="100">
            Fra mottak av forurensede masser til salg av rene, dokumenterte produkter – med eget laboratorium og miljørådgivere hele veien.
          </p>
        </div>

        <div className="mt-20 space-y-28 lg:space-y-40">
          {/* A — Massemottak */}
          <ServiceRow service={a} visual={
            <SceneFrame
              className="aspect-[4/3] w-full rounded-[28px]"
              label="3D-illustrasjon: en lastebil kjører inn i mottakshallen og tipper jordmasser."
              camera={{ fov: 36, position: [-2.6, 1.6, 5.2] }}
              poster={<Poster src={a.image} alt="Gravemaskin og operatør i Envirs mottakshall" />}
            >
              {(ctx) => <Reception {...ctx} />}
            </SceneFrame>
          } />

          {/* B — Salg av gjenvunne masser */}
          <ServiceRow
            service={b}
            reverse
            visual={
              <div>
                <SceneFrame
                  className="aspect-[4/3] w-full [mask-image:linear-gradient(90deg,transparent_0%,black_16%,black_84%,transparent_100%)]"
                  transparent
                  label={`3D-illustrasjon av gjenvunne fraksjoner. Valgt: ${product.name}.`}
                  camera={{ fov: 30, position: [0, 1.5, 4.4] }}
                  alwaysRender
                  poster={<div className="absolute inset-0 flex items-center justify-center"><Image src={`/assets/materials/renders/${product.id}.webp`} alt="" width={800} height={600} sizes="40vw" quality={80} className="w-[62%]" /></div>}
                >
                  {(ctx) => <Materials {...ctx} selected={sceneFraction} />}
                </SceneFrame>
              </div>
            }
          >
            <div className="mt-8">
              <p id="fraksjoner" className="text-sm font-semibold text-graphite/70">
                Velg fraksjon
              </p>
              <div role="group" aria-labelledby="fraksjoner" className="mt-3 flex flex-wrap gap-2">
                {CAROUSEL.map((id, i) => {
                  const p = products.find((x) => x.id === id)!;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFraction(i)}
                      aria-pressed={fraction === i}
                      className={`rounded-full border px-4 py-2 text-sm font-medium tabular-nums transition-colors ${
                        fraction === i ? "border-forest bg-forest text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50"
                      }`}
                    >
                      {p.min}–{p.max} mm
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex gap-4 rounded-2xl border border-graphite/10 bg-white p-4" aria-live="polite">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                  <Image src={product.image} alt={product.name} fill sizes="96px" quality={70} className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-forest-950">{product.name}</p>
                  <p className="mt-1 text-sm leading-snug text-graphite/70">{product.text}</p>
                  <p className="mt-2 text-sm font-semibold text-forest">
                    Kr {product.price},- <span className="font-normal text-graphite/70">per tonn eks. mva.</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-graphite/70">{priceNote}</p>
            </div>
          </ServiceRow>

          {/* C — Jordbehandling */}
          <ServiceRow service={c} visual={
            <SceneFrame
              className="aspect-[4/3] w-full rounded-[28px]"
              label="3D-illustrasjon: tverrsnitt av en vasketrommel der masser vaskes med vann. Slammet går til filterpresse."
              camera={{ fov: 36, position: [0, 2.1, 4.6] }}
              poster={<Poster src={c.image} alt="Envirs jordvaskeanlegg med plattformer og transportbånd" />}
            >
              {(ctx) => <Wash {...ctx} />}
            </SceneFrame>
          } />

          {/* D — Laboratorium */}
          <ServiceRow service={d} reverse visual={
            <SceneFrame
              className="aspect-[4/3] w-full rounded-[28px]"
              background="#eef0ec"
              label="3D-illustrasjon: jordprøve i reagensrør på en laboratoriebenk med siktesett og prøveglass."
              camera={{ fov: 32, position: [0, 1.4, 3.8] }}
              poster={<Poster src={d.image} alt="Laboratorietekniker setter et reagensrør med jordprøve i stativet" dim={false} />}
            >
              {(ctx) => <Lab {...ctx} />}
            </SceneFrame>
          } />
        </div>
      </div>
    </section>
  );
}

function ServiceRow({
  service,
  visual,
  reverse,
  children,
}: {
  service: (typeof services)[number];
  visual: React.ReactNode;
  reverse?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16" aria-labelledby={`svc-${service.id}`}>
      <div className={`lg:col-span-7 ${reverse ? "lg:order-2" : ""}`} data-reveal>
        <div className="relative">
          {visual}
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-night/60 px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/80 backdrop-blur">
            3D-illustrasjon
          </span>
        </div>
      </div>
      <div className={`lg:col-span-5 ${reverse ? "lg:order-1" : ""}`}>
        <div className="flex items-baseline gap-4" data-reveal>
          <span aria-hidden data-num={service.index} className="display text-[5rem] leading-none text-forest/10 before:content-[attr(data-num)] lg:text-[7rem]" />
          <p className="eyebrow text-emerald-700">{service.kicker}</p>
        </div>
        <h3 id={`svc-${service.id}`} className="display mt-2 text-[clamp(1.9rem,3.2vw,2.9rem)] text-forest-950 text-balance" data-reveal>
          {service.title}
        </h3>
        <p className="mt-5 text-[1.05rem] leading-relaxed text-graphite/75" data-reveal>
          {service.text}
        </p>
        {service.bullets.length > 0 && (
          <ul className="mt-6 space-y-2.5" data-reveal>
            {service.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[0.98rem] text-graphite">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                {b}
              </li>
            ))}
          </ul>
        )}
        {"note" in service && service.note && <p className="mt-4 text-sm text-graphite/70">{service.note}</p>}
        {children}
        <div className="mt-8">
          <ButtonLink href={service.href} tone="forest">
            {service.cta}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
