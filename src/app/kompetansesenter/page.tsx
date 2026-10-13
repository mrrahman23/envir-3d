import Image from "next/image";
import type { Metadata } from "next";
import { Cards, CtaBand, PageHero, Section, SectionHead } from "@/components/page";

export const metadata: Metadata = {
  title: "Kompetansesenter | Eksperter på jordrensing",
  description: "Envir Kompetansesenter deler kunnskap om bærekraftig massehåndtering, miljøteknologi og gjenvinning – for bransjen og samfunnet.",
  alternates: { canonical: "/kompetansesenter" },
};

const people = [
  { name: "Kolbjørn Akervold", role: "COO / Fagdirektør", image: "/assets/team/kolbjorn_akervold.webp" },
  { name: "Fredrik Årvåg", role: "Driftsleder", image: "/assets/team/fredrik_arvag.webp" },
  { name: "Anne Husby Rosnes", role: "Miljørådgiver", image: "/assets/team/anne_husby_rosnes.jpg" },
  { name: "Elisabeth Nesse", role: "Miljøgeolog", image: "/assets/team/elisabeth_nesse.webp" },
  { name: "Kristin Aa", role: "Fagansvarlig jord / HMS-ansvarlig", image: "/assets/team/kristin_aa.jpg" },
  { name: "Jo Hellesund", role: "Laboratorieleder", image: "/assets/team/jo_hellesund.jpg" },
  { name: "Artur Ferensowicz", role: "Lab tekniker", image: "/assets/team/artur_ferensowicz.jpg" },
];

export default function KompetansePage() {
  return (
    <>
      <PageHero
        eyebrow="Kompetansesenter"
        title="Envir Kompetansesenter"
        lead="Vi deler kunnskap om bærekraftig massehåndtering, miljøteknologi og gjenvinning – for bransjen og samfunnet."
        image="/assets/envir/kompetansesenter-hero.webp"
        imageAlt="Envir-ansatt i laboratoriet"
        position="center 30%"
      />
      <Section labelledBy="team-k">
        <SectionHead eyebrow="Vårt team" id="team-k" title="Menneskene bak kompetansesenteret" />
        <ul className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {people.map((p) => (
            <li key={p.name} data-reveal>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-paper-200">
                <Image src={p.image} alt={p.name} fill sizes="(min-width:1024px) 25vw, 50vw" quality={70} className="object-cover" />
              </div>
              <p className="mt-4 font-semibold text-forest-950">{p.name}</p>
              <p className="text-sm text-graphite/70">{p.role}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="sand" labelledBy="tilbyr">
        <SectionHead eyebrow="Kompetanse" id="tilbyr" title="Hva vi tilbyr" />
        <Cards
          items={[
            { title: "Fagartikler og rapporter", text: "Vi publiserer fagstoff om jordforurensning, gjenvinningsmetoder og miljøregelverk." },
            { title: "Forskning og utvikling", text: "Envir samarbeider med forskningsinstitusjoner for å utvikle nye metoder for jordrensing." },
            { title: "Bransjesamarbeid", text: "Vi deltar aktivt i bransjeforeninger og bidrar til utvikling av standarder og retningslinjer." },
          ]}
        />
      </Section>
      <CtaBand title="Ønsker du å vite mer?" text="Ta kontakt for å høre om kommende arrangementer eller for å diskutere samarbeid." />
    </>
  );
}
