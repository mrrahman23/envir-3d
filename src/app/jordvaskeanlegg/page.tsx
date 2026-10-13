import type { Metadata } from "next";
import { Cards, ContactStrip, PageHero, Section, SectionHead, Steps } from "@/components/page";
import { ButtonLink } from "@/components/ui";
import { WashProcessDiagram } from "@/components/diagrams";
import { washSteps } from "@/content/site";

export const metadata: Metadata = {
  title: "Jordvaskeanlegg | Industriell vasking av jord",
  description: "Over 80 % gjenvinningsgrad: Envirs jordvaskeanlegg vasker forurensede masser mekanisk og med vann, uten tilsetning av kjemikalier.",
  alternates: { canonical: "/jordvaskeanlegg" },
};

export default function JordvaskPage() {
  return (
    <>
      <PageHero
        eyebrow="Jordvaskeanlegg"
        title="Jordvaskeanlegg"
        image="/assets/envir/jordvaskeanlegg.jpg"
        imageAlt="Envirs jordvaskeanlegg med plattformer og transportbånd inne i hallen"
        stats={[
          { v: "80%", l: "gjenvinningsgrad" },
          { v: "Lavere", l: "kostnader og CO₂-utslipp" },
          { v: "Vinn-vinn", l: "for miljø og økonomi" },
        ]}
      />
      <Section labelledBy="om-vask">
        <div className="grid gap-10 lg:grid-cols-2">
          <h2 id="om-vask" className="display text-[clamp(2rem,4vw,3.4rem)] text-forest-950 text-balance" data-reveal>
            Over 80 % av massene gjenvinnes.
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-graphite/80" data-reveal>
            <p>
              På vårt jordvaskeanlegg oppnår vi en imponerende gjenvinningsgrad på over 80 %. Dette er fordi jorden på Vestlandet er veldig godt egnet for gjenvinning, fordi vi er flinke og fordi vi har et avansert anlegg som klarer å rense de fineste massene rene.
            </p>
            <p>Dette betyr at massene kan gjenbrukes i stedet for å sendes til deponier, noe som reduserer både kostnader og CO₂-utslipp. Hos Envir er det en vinn-vinn-vinn.</p>
          </div>
        </div>
      </Section>
      <Section tone="dark" labelledBy="slik">
        <SectionHead dark eyebrow="Prosessen" id="slik" title="Slik fungerer det" />
        <Steps dark steps={washSteps} />
      </Section>
      <Section tone="white" labelledBy="flyt">
        <SectionHead eyebrow="Prosessdiagram" id="flyt" title="Hvor massene – og forurensningene – går" />
        <div className="mt-10">
          <WashProcessDiagram />
        </div>
      </Section>
      <Section tone="sand" labelledBy="mer">
        <SectionHead eyebrow="Mer fra anlegget" id="mer" title="Kai, laboratorium og rådgivning" />
        <Cards
          items={[
            {
              title: "ISPS-kai",
              text: "Vi opererer også vår egen ISPS-kai, som kan ta imot båter opp til drøyt 5000 tonn. For store prosjekter kan vi da ta imot eller skipe ut massene med båt, og dermed spare veinettet for hundrevis av lastebiler. Det gjør det også mulig å skipe ut spesielt forurensede masser til anlegg i Europa som har tillatelse til å håndtere disse.",
              href: "/isps-kai",
            },
            { title: "TML-tester", text: "Vårt laboratorium tilbyr pålitelige TML-tester (Transport Moisture Limit) for dine masser, en nødvendighet for sikker og godkjent transport med båt.", href: "/laboratorium" },
            { title: "Miljørådgivere", text: "Gjennom aktiv miljørådgivning og -veiledning hjelper vi til med å øke kunnskapen om forurenset jord og gravemasser, og viktigheten av å kunne gjenbruke og rense disse på en trygg måte.", href: "/kompetansesenter" },
          ]}
        />
      </Section>
      <Section labelledBy="kontakt-vask">
        <SectionHead id="kontakt-vask" title="Kontakt oss" lead="Ta kontakt for å diskutere gjenvinning av forurensede masser." />
        <ContactStrip />
        <div className="mt-8">
          <ButtonLink href="/kontakt" tone="forest">
            Send en henvendelse
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
