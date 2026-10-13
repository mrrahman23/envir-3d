import type { Metadata } from "next";
import { CtaBand, PageHero, Section, SectionHead, Steps } from "@/components/page";

export const metadata: Metadata = {
  title: "Jorddampeanlegg | Damping av jord med fremmede arter",
  description: "Jorddamping ved over 94 °C dreper skadelige fremmedarter som parkslirekne, rynkerose og lupiner – kun med varmt vann under trykk.",
  alternates: { canonical: "/jorddampeanlegg" },
};

const steps = [
  { title: "Mottakskontroll", text: "Før jorden dampes, utfører vi en mottakskontroll for å bekrefte at den ikke inneholder miljøgifter over normverdier. Dersom jorden er kjemisk forurenset, vil vi vurdere andre løsninger, slik som jordvask." },
  { title: "Før damping", text: "Stein større enn 20 mm fjernes gjennom sikting eller solding, og ferdigsilt jord mates inn i jorddamperen." },
  { title: "Damping", text: "I jorddamperen, varmes jorden opp til 94°C i minst 20 minutter med vanlig vanndamp. Dette dreper effektivt ugras, sopp og mikroorganismer. Vi kan nå si at jorden har blitt sterilisert." },
  { title: "Etter damping", text: "Ferdig dampet jord kjøles ned og blandes med vasket grovsand for å gjenopprette struktur og bidra til at den tørker raskere. Dette sand- og jordproduktet kalles nå for anleggsjord." },
  { title: "Hygiene", text: "Gjennom hele prosessen er det et tydelig skille mellom ren og skitten sone der ubehandlet jord aldri blandes med ferdig produkt. Anleggsjorden du kjøper fra Envir er 100% ugrasfri i det den forlater vårt anlegg." },
];

export default function JorddampPage() {
  return (
    <>
      <PageHero
        eyebrow="Jorddampeanlegg"
        title="Jorddamping"
        image="/assets/envir/jorddampeanlegg-hero.webp"
        imageAlt="Envir-ansatte foran jorddamperen"
        stats={[
          { v: "Over 94°C", l: "dampbehandling" },
          { v: "100%", l: "ugrasfri" },
          { v: "Miljøvennlig", l: "ingen kjemikalier" },
        ]}
      />
      <Section labelledBy="om-damp">
        <div className="grid gap-10 lg:grid-cols-2">
          <h2 id="om-damp" className="display text-[clamp(2rem,4vw,3.4rem)] text-forest-950 text-balance" data-reveal>
            Kun varmt vann under trykk.
          </h2>
          <p className="text-lg leading-relaxed text-graphite/80" data-reveal>
            Jorddamping er en miljøvennlig og effektiv metode for å drepe skadelige fremmedarter, slik som parkslirekne, rynkerose og lupiner – kun ved hjelp av varmt vann under trykk! Spredning av skadelige fremmedarter skaper store problemer, både i Norge og internasjonalt. De gjør at ellers brukbar jord sendes på dynga, eller at miljøgifter spres til omgivelsene gjennom bruk av plantevernmidler. Prosessen er enkel:
          </p>
        </div>
      </Section>
      <Section tone="dark" labelledBy="slik">
        <SectionHead dark eyebrow="Prosessen" id="slik" title="Slik fungerer det" />
        <Steps dark steps={steps} />
      </Section>
      <CtaBand title="Trenger du jorddamping?" text="Kontakt oss for å diskutere behandling av jord med fremmede arter." />
    </>
  );
}
