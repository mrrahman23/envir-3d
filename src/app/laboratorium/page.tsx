import Image from "next/image";
import type { Metadata } from "next";
import { Cards, CtaBand, PageHero, Section } from "@/components/page";

export const metadata: Metadata = {
  title: "Laboratorium | Jordanalyse i Bergen",
  description: "Envirs eget laboratorium analyserer kjemisk forurensning i levert masse og geotekniske egenskaper for de gjenvunne massene. Testsertifikater ved kjøp.",
  alternates: { canonical: "/laboratorium" },
};

export default function LabPage() {
  return (
    <>
      <PageHero
        eyebrow="Laboratorium"
        title="Laboratorium for jordprøver"
        lead="Vårt eget laboratorium ligger i den gamle hydraulikkhallen og er delt i to: Analyse av kjemisk forurensning i massene og geo-tekniske egenskaper for de gjenvunne massene."
        image="/assets/envir/kompetansesenter-hero.webp"
        imageAlt="Envir-ansatt i laboratoriet sammen med kolleger"
        position="center 30%"
      />
      <Section labelledBy="om-lab">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5 text-lg leading-relaxed text-graphite/80" data-reveal>
            <h2 id="om-lab" className="display text-[clamp(2rem,4vw,3.2rem)] text-forest-950">
              Vi finner ut hva jorden er forurenset med.
            </h2>
            <p>
              Gjennom grundig analyse med avansert teknologi og metoder, kan vi hjelpe våre kunder å undersøke massene de leverer til oss. Dermed kan vi raskt finne ut av hva jorden er forurenset med. Våre eksperter hjelper deg å tolke og forklare resultatene.
            </p>
            <p>Sammen kan vi da finne den beste, korrekte og mest økonomiske måten å håndtere massene på.</p>
            <p>Laboratoriet tar også analyser av alle de gjenvunne massene, slik at når du kjøper sand, singel, grus og pukk kan du være trygg på at du får den kvaliteten du har bestilt.</p>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[28px]" data-reveal-img>
            <Image src="/assets/envir/envir-lab-detaljbilde-3.jpg" alt="Laboratorietekniker setter et reagensrør med jordprøve i stativet" fill sizes="(min-width:1024px) 50vw, 100vw" quality={70} className="object-cover" />
          </div>
        </div>
        <Cards
          items={[
            { title: "Kjemisk analyse", text: "Analyse av kjemisk forurensning i levert masse med avansert teknologi og metoder." },
            { title: "Testsertifikater", text: "Alle gjenvunne masser analyseres, og du får med testsertifikater ved kjøp av sand, singel, grus og pukk." },
            { title: "Ekspertrådgivning", text: "Våre eksperter hjelper deg å tolke og forklare resultatene, slik at vi finner den beste løsningen." },
          ]}
        />
      </Section>
      <CtaBand title="Trenger du analyse av jordprøver?" text="Kontakt oss for å få hjelp med analyse og rådgivning om massehåndtering." />
    </>
  );
}
