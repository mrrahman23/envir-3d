import type { Metadata } from "next";
import { Cards, CtaBand, PageHero, Section } from "@/components/page";

export const metadata: Metadata = {
  title: "ISPS-kai | Sjøtransport av masser",
  description: "Envirs ISPS-godkjente kai i Laksevåg tar imot og sender ut store volumer av jord- og steinmasser sjøveien – effektivt og miljøvennlig.",
  alternates: { canonical: "/isps-kai" },
};

export default function IspsPage() {
  return (
    <>
      <PageHero
        eyebrow="ISPS-kai"
        title="ISPS-kai"
        lead="Envir disponerer ISPS-godkjent kai med kapasitet til å håndtere store volumer av masser sjøveien – effektivt og miljøvennlig."
        image="/assets/envir/hero-bg.webp"
        imageAlt="Envir-ansatt i anleggshallen"
      />
      <Section labelledBy="sjo">
        <div className="grid gap-10 lg:grid-cols-2">
          <h2 id="sjo" className="display text-[clamp(2rem,4vw,3.4rem)] text-forest-950" data-reveal>
            Sjøtransport av masser
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-graphite/80" data-reveal>
            <p>
              Vår ISPS-godkjente kai i Laksevåg gjør det mulig å ta imot og sende ut store volumer av jord- og steinmasser via sjøveien. Dette reduserer tungtransport på vei og gir lavere CO₂-utslipp per transportert tonn.
            </p>
            <p>Kaien er tilknyttet vårt produksjonsanlegg, slik at masser kan losses direkte til behandling uten ekstra mellomlagring.</p>
          </div>
        </div>
        <Cards
          cols={4}
          items={[
            { title: "Dypvannskai", text: "Kapasitet for store lektere og fartøy med dyptgående opptil 8 meter." },
            { title: "ISPS-godkjent", text: "Kaien oppfyller internasjonale sikkerhetskrav i henhold til ISPS-koden." },
            { title: "Dokumentert mottak", text: "All lossing dokumenteres med vekt, analyse og sporbarhet." },
            { title: "Fleksible åpningstider", text: "Vi tilpasser lossing etter skipets ankomsttid og tidevannsforhold." },
          ]}
        />
      </Section>
      <CtaBand title="Planlegger du sjøtransport av masser?" text="Kontakt oss for å planlegge lossing eller lasting ved vår kai." />
    </>
  );
}
