"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { company } from "@/content/site";
import ContactForm from "@/components/ContactForm";
import SceneFrame from "@/components/three/SceneFrame";
import { ArrowUpRight, Eyebrow, Icon } from "@/components/ui";

const ContactScene = dynamic(() => import("@/three/ContactScene"), { ssr: false });

export default function Contact() {
  const [service, setService] = useState("");
  const pick = (s: string) => {
    setService(s);
    requestAnimationFrame(() => {
      const el = document.getElementById("kontaktskjema");
      el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      el?.querySelector<HTMLElement>("input,textarea")?.focus({ preventScroll: true });
    });
  };

  const actions = [
    { title: "Lever masser", text: "Mottakskontroll, priser og levering av forurensede masser.", href: "/mottak" },
    { title: "Kjøp gjenvunne masser", text: "CE-merket pukk, singel, grus, sand og anleggsjord.", href: "/gjenvunne-masser" },
    { title: "Be om tilbud", text: "Fortell oss om prosjektet, så finner vi den beste løsningen.", onClick: () => pick("Forespørsel om tilbud") },
    { title: "Kontakt oss", text: `Ring ${company.phone} eller send oss en melding.`, onClick: () => pick("") },
  ];

  return (
    <section id="kontakt" aria-labelledby="contact-title" className="on-light relative overflow-hidden bg-[#eef1ea]">
      <SceneFrame
        className="absolute inset-x-0 top-[17rem] h-[62svh] min-h-[420px] sm:top-[15rem]"
        background="#eef1ea"
        label="3D-illustrasjon: et grønt landskap med skog og et lite industrianlegg ved sjøen."
        camera={{ fov: 30, position: [0, 4.2, 12.5] }}
        poster={<div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_70%,#dfe8d6_0%,#eef1ea_70%)]" />}
      >
        {(ctx) => <ContactScene {...ctx} />}
      </SceneFrame>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[17rem] h-[62svh] min-h-[420px] bg-[linear-gradient(180deg,#eef1ea_0%,rgba(238,241,234,0)_22%,rgba(238,241,234,0)_70%,#eef1ea_100%)] sm:top-[15rem]" />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-24 pt-24 sm:px-6 lg:px-10 lg:pb-32">
        <div className="max-w-3xl">
          <Eyebrow className="text-emerald-700">Kontakt</Eyebrow>
          <h2 id="contact-title" className="display mt-6 text-[clamp(2.6rem,6vw,5.4rem)] text-forest-950 text-balance" data-reveal>
            Ta kontakt med oss
          </h2>
          <p className="mt-5 max-w-xl text-lg text-graphite/75" data-reveal data-reveal-delay="100">
            Har du spørsmål om våre tjenester, priser eller leveranser? Fyll ut skjemaet så tar vi kontakt innen én virkedag.
          </p>
        </div>

        <ul className="mt-[clamp(18rem,50svh,30rem)] grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((a) => {
            const inner = (
              <>
                <span className="flex items-start justify-between gap-4">
                  <span className="display text-[1.45rem] text-forest-950">{a.title}</span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-forest transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                </span>
                <span className="mt-3 block text-[0.95rem] text-graphite/70">{a.text}</span>
              </>
            );
            const cls = "group block h-full w-full rounded-[24px] border border-white bg-white/75 p-6 text-left shadow-[0_20px_50px_-35px_rgba(0,65,55,0.45)] backdrop-blur-md transition-colors hover:bg-white";
            return (
              <li key={a.title}>
                {a.href ? (
                  <Link href={a.href} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={a.onClick} className={cls}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-[28px] bg-forest-950 p-8 text-white sm:p-10">
            <h3 className="display text-2xl">Envir AS</h3>
            <ul className="mt-8 space-y-6">
              <li className="flex gap-4">
                <Icon name="phone" className="mt-0.5 h-5 w-5 text-lime" />
                <div>
                  <p className="text-sm text-white/55">Telefon</p>
                  <a href={company.phoneHref} className="text-lg hover:text-lime">
                    {company.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Icon name="mail" className="mt-0.5 h-5 w-5 text-lime" />
                <div>
                  <p className="text-sm text-white/55">E-post</p>
                  <a href={`mailto:${company.email}`} className="text-lg hover:text-lime">
                    {company.email}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Icon name="pin" className="mt-0.5 h-5 w-5 text-lime" />
                <div>
                  <p className="text-sm text-white/55">Adresse</p>
                  <a href={company.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-lg hover:text-lime">
                    {company.address}, {company.postal}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Icon name="clock" className="mt-0.5 h-5 w-5 text-lime" />
                <div>
                  <p className="text-sm text-white/55">Åpningstider</p>
                  {company.hours.map((h) => (
                    <p key={h.d} className="text-lg">
                      {h.d}: {h.t}
                    </p>
                  ))}
                </div>
              </li>
            </ul>
          </div>
          <div id="kontaktskjema" className="scroll-mt-28 rounded-[28px] bg-white p-6 shadow-[0_30px_80px_-50px_rgba(0,65,55,0.5)] sm:p-10">
            <h3 className="display text-2xl text-forest-950">Send en henvendelse</h3>
            <div className="mt-6">
              <ContactForm key={service} defaultService={service} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
