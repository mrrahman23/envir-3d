"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { about, contacts } from "@/content/site";
import Parallax from "@/components/Parallax";
import { ButtonLink, Eyebrow, TextLink } from "@/components/ui";

export default function About() {
  const strip = useRef<HTMLOListElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = strip.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 320) + 16), behavior: "smooth" });
  };

  return (
    <section id="om-envir" aria-labelledby="about-title" className="relative bg-paper">
      {/* Machinery → people: cinematic full-bleed transition */}
      <div className="relative h-[78svh] min-h-[520px] overflow-hidden bg-night">
        <Parallax amount={14}>
          <Image src="/assets/envir/ansatte.webp" alt="En Envir-ansatt på en plattform høyt oppe i anleggshallen" fill sizes="100vw" quality={70} className="object-cover" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#07181a_0%,rgba(7,24,26,0.2)_35%,rgba(7,24,26,0.15)_60%,#f5f4ee_100%)]" />
        <div className="relative mx-auto flex h-full max-w-[1440px] items-end px-4 pb-16 sm:px-6 lg:px-10">
          <p className="display max-w-4xl text-[clamp(2.4rem,6vw,5.6rem)] text-forest-950" data-reveal>
            Avansert teknologi. Erfarne mennesker.
          </p>
        </div>
      </div>

      <div className="on-light mx-auto max-w-[1440px] px-4 pb-8 pt-8 sm:px-6 lg:px-10 lg:pb-12">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow className="text-emerald-700">Om Envir</Eyebrow>
            <h2 id="about-title" className="display mt-6 text-[clamp(2.2rem,4vw,3.6rem)] text-forest-950 text-balance" data-reveal>
              {about.title}
            </h2>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-forest/15 pt-6">
              {about.facts.map((f) => (
                <div key={f.l}>
                  <dt className="sr-only">{f.l}</dt>
                  <dd className="display text-[clamp(1.6rem,3vw,2.4rem)] leading-none text-forest">{f.v}</dd>
                  <dd className="mt-2 text-sm text-graphite/70">{f.l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-5 text-[1.08rem] leading-relaxed text-graphite/80 lg:col-span-6 lg:col-start-7" data-reveal>
            <p>{about.text}</p>
            <p>{about.text2}</p>
            <div className="pt-2">
              <TextLink href="/om-oss" className="text-forest">
                Les mer om oss
              </TextLink>
            </div>
          </div>
        </div>

        {/* Quote */}
        <figure className="mt-24 grid items-center gap-8 rounded-[32px] bg-forest-950 p-8 text-white sm:p-12 lg:grid-cols-[auto_1fr] lg:gap-14" data-reveal>
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-lime/30 sm:h-36 sm:w-36">
            <Image src={about.quote.image} alt={about.quote.name} fill sizes="144px" className="object-cover" />
          </div>
          <div>
            <blockquote className="display text-[clamp(1.4rem,2.6vw,2.2rem)] font-medium leading-snug tracking-tight">
              <span aria-hidden className="text-lime">«</span>
              {about.quote.text}
              <span aria-hidden className="text-lime">»</span>
            </blockquote>
            <figcaption className="mt-6 text-white/70">
              <span className="font-semibold text-white">{about.quote.name}</span> — {about.quote.role}
            </figcaption>
          </div>
        </figure>

        {/* Timeline */}
        <div className="mt-24">
          <div className="flex items-end justify-between gap-6">
            <div>
              <Eyebrow className="text-emerald-700">Vår historie</Eyebrow>
              <h3 className="display mt-5 text-[clamp(2rem,3.6vw,3.2rem)] text-forest-950">Fra visjon til virkelighet</h3>
            </div>
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => scrollBy(-1)} className="h-12 w-12 rounded-full border border-forest/20 text-forest transition-colors hover:bg-forest hover:text-paper" aria-label="Forrige milepæl">
                ←
              </button>
              <button type="button" onClick={() => scrollBy(1)} className="h-12 w-12 rounded-full border border-forest/20 text-forest transition-colors hover:bg-forest hover:text-paper" aria-label="Neste milepæl">
                →
              </button>
            </div>
          </div>
          <ol ref={strip} className="snap-x-strip -mx-4 mt-10 flex scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10" style={{ perspective: "1200px" }} tabIndex={0} aria-label="Tidslinje, rull horisontalt">
            {about.timeline.map((m, i) => (
              <li
                key={m.year}
                className="group relative w-[82vw] max-w-[380px] shrink-0 snap-start rounded-[28px] border border-forest/10 bg-white p-8 shadow-[0_24px_60px_-40px_rgba(0,65,55,0.4)] transition-transform duration-700 ease-[var(--ease-cine)] hover:[transform:rotateY(-6deg)_translateZ(20px)]"
              >
                <span aria-hidden data-num={String(i + 1).padStart(2, "0")} className="display absolute right-6 top-4 text-[5.5rem] leading-none text-forest/[0.06] before:content-[attr(data-num)]" />
                <p className="display text-[3.2rem] leading-none text-emerald-700">{m.year}</p>
                <div className="mt-6 h-px w-full bg-forest/10">
                  <div className="h-px w-1/3 bg-lime transition-all duration-700 group-hover:w-full" />
                </div>
                <h4 className="display mt-6 text-2xl text-forest-950">{m.title}</h4>
                <p className="mt-3 leading-relaxed text-graphite/70">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* People */}
        <div className="mt-20 flex flex-col gap-8 rounded-[32px] border border-forest/10 bg-white p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="display text-[1.9rem] text-forest-950">Menneskene i Envir</h3>
            <p className="mt-2 max-w-md text-graphite/70">Miljørådgivere, operatører, laboratoriepersonell og salg – et team som hjelper deg fra første prøve til ferdig dokumentasjon.</p>
          </div>
          <ul className="flex -space-x-3" aria-label="Utvalgte ansatte">
            {contacts.map((c) => (
              <li key={c.name} className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-white sm:h-20 sm:w-20" title={`${c.name}, ${c.role}`}>
                <Image src={c.image} alt={`${c.name}, ${c.role}`} fill sizes="80px" quality={70} className="object-cover" />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/team" tone="forest">
              Møt menneskene i Envir
            </ButtonLink>
            <Link href="/kompetansesenter" className="self-center text-sm font-semibold text-forest underline underline-offset-4">
              Kompetansesenter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
