import type { Metadata } from "next";
import { Cards, PageHero, QuoteBand, Section, SectionHead, Steps } from "@/components/page";
import { ButtonLink } from "@/components/ui";
import { company, priceNote, receptionPrices } from "@/content/site";

export const metadata: Metadata = {
  title: "Massemottak | Levering av forurenset jord",
  description: "Lever forurensede masser i tilstandsklasse 2 til 5 og jord med uønskede fremmedarter til Envir på Laksevåg – under 10 minutter fra Bergen sentrum.",
  alternates: { canonical: "/mottak" },
};

const control = [
  {
    title: "Godkjenning av miljørådgiver",
    text: "Vi må få oversendt dokumentasjon, slik som miljøteknisk grunnundersøkelse eller tiltaksplan. Der tiltaksplan eller grunnundersøkelse ikke foreligger, ønsker vi analysebevis fra prøvetaking, adressen til graveområdet, kart der omfanget av gravetiltaket er merket, avmerking av prøvepunkt og gjerne bilder av masser/område.",
  },
  { title: "Ved manglende prøvetaking", text: "Dersom det ikke er tatt prøver av massene, vil våre miljørådgivere kunne bistå med rådgivning ved prøvetaking og analyser." },
  {
    title: "Det miljørådgiverne kontrollerer",
    text: "Våre miljørådgivere vil sjekke at massene er i tråd med tillatelsen til behandling som Envir har, og om de er egnet til gjenvinning i våre anlegg. Massene bør inneholde minst mulig av asfalt, betong, metall, plast, vegetasjon, store røtter og annet avfall. Vi har derimot ingen grenseverdi på organisk innhold (TOC), som ofte er en utfordring ved levering til andre typer anlegg.",
  },
  { title: "Dersom massene ikke er egnet", text: "Dersom vi ikke kan ta imot eller gjenvinne massene i våre anlegg, vil vi bistå med å finne andre løsninger." },
];

const why = [
  { title: "Sentrumsnært anlegg", text: "Under 10 minutter fra Bergen sentrum – kort transportvei betyr lavere kostnader og redusert CO₂-utslipp for ditt prosjekt." },
  { title: "Mottak kl. 2–5 og fremmedarter", text: "Vi tar imot forurensede masser i tilstandsklasse 2 til 5 og jord med uønskede fremmedarter som parkslirekne. Vi kan ikke ta imot masser klassifisert som farlig avfall." },
  { title: "Laboratorium og prøvetaking", text: "Eget laboratorium på anlegget gir rask analyse og dokumentasjon. Vi kan bistå med prøvetaking og rådgivning allerede i planleggingsfasen." },
  { title: "Bedre for miljøet", text: "Opp til 80 % av massene gjenvinnes til nye produkter. Sirkulær massehåndtering reduserer behovet for jomfruelige masser og deponi." },
  { title: "Bedre CO₂-rapportering", text: "Dokumentert gjenvinning gir målbare klimagevinster du kan bruke i prosjektets bærekraftsrapportering og EPD-beregninger." },
  { title: "Dokumentasjon og rådgivning", text: "Det stilles krav til analysebevis, miljøteknisk grunnundersøkelse eller tiltaksplan. Vi hjelper deg med å få dokumentasjonen på plass." },
];

export default function MottakPage() {
  return (
    <>
      <PageHero
        eyebrow="Mottak"
        title="Mottak av forurensede masser"
        lead="Mottak av forurensede masser i tilstandsklasse 2 til 5, og jord med uønskede fremmede arter."
        image="/assets/envir/service-massemottak.webp"
        imageAlt="Gravemaskin og operatør ved massene i Envirs mottakshall"
      >
        <ButtonLink href="#tilbud-title">Be om tilbud</ButtonLink>
        <ButtonLink href={company.docs.prisliste} tone="ghost-light">
          Prisliste (PDF)
        </ButtonLink>
      </PageHero>

      <Section labelledBy="kontroll">
        <SectionHead
          eyebrow="Innlevering"
          id="kontroll"
          title="Mottakskontroll før innlevering"
          lead="Før en kan levere masser til Envir, må en dokumentere at nivået av forurensning ikke er for høyt og at massene er egnet for gjenvinning. Dette gjør vi gjennom vår mottakskontroll:"
        />
        <Steps steps={control} />
        <p className="mt-8 max-w-3xl rounded-2xl border border-emerald/25 bg-emerald/5 p-6 text-graphite/80">
          Er massene av god jord og ren for kjemiske forurensninger (under normverdier), men inneholder skadelige fremmedarter, vil fagansvarlig for jord gjøre en vurdering om Envir kan gjenvinne dem til anleggsjord i vår jorddamper.
        </p>
      </Section>

      <Section tone="dark" labelledBy="priser">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionHead dark eyebrow="Priser" id="priser" title="Mottakspriser" lead="Priseksempler for levering av masser til Envir. Se full prisliste for alle produkter og vilkår." />
          <div>
            <table className="w-full text-left">
              <caption className="sr-only">Mottakspriser per tonn</caption>
              <thead>
                <tr className="border-b border-white/15 text-sm text-white/55">
                  <th scope="col" className="py-3 font-medium">Beskrivelse mottak masser</th>
                  <th scope="col" className="py-3 text-right font-medium">Pris/tonn</th>
                </tr>
              </thead>
              <tbody>
                {receptionPrices.map((p) => (
                  <tr key={p.label} className="border-b border-white/10">
                    <td className="py-5 text-lg">{p.label}</td>
                    <td className="display py-5 text-right text-2xl text-lime">{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-sm text-white/55">{priceNote}</p>
            <div className="mt-8">
              <ButtonLink href={company.docs.prisliste} tone="ghost-light">
                Se full prisliste
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="sand" labelledBy="prosesser">
        <SectionHead eyebrow="Slik fungerer det" id="prosesser" title="Våre prosesser" />
        <Cards
          cols={2}
          items={[
            { title: "Vaskeprosessen", text: "Industriell vask og sortering av forurensede masser.", href: "/jordvaskeanlegg" },
            { title: "Jorddampeprosessen", text: "Damping av jord med fremmede arter ved 94 °C.", href: "/jorddampeanlegg" },
          ]}
        />
      </Section>

      <Section labelledBy="hvorfor">
        <SectionHead
          eyebrow="Hvorfor velge Envir"
          id="hvorfor"
          title="Bærekraftig massehåndtering – rett utenfor Bergen sentrum"
          lead="Hos Envir får du tilgang til Norges mest moderne anlegg for gjenvinning av forurensede masser. Vi kombinerer kort transportvei, eget laboratorium og høy fagkompetanse for å gi deg en enklere, grønnere og mer kostnadseffektiv løsning."
        />
        <Cards items={why} />
        <div className="mt-12 grid gap-6 rounded-[28px] bg-forest-950 p-8 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h3 className="display text-2xl">Team Envir hjelper deg hele veien</h3>
            <p className="mt-3 max-w-3xl leading-relaxed text-white/75">
              Vårt hyggelige og erfarne team kan bistå med rådgivning av massehåndtering i anbudsfase, planlegging og gjennomføring av prosjektet. Vi er klare til å hjelpe deg – fra første prøve til ferdig dokumentasjon. Gjennom aktiv miljørådgivning øker vi kunnskapen om viktigheten av å gjenbruke og rense masser på en trygg måte.
            </p>
            <p className="mt-4 font-semibold text-lime">Fokus: ingen tomme lastebiler – ved god planlegging kan sirkulærøkonomi øke bunnlinjen.</p>
          </div>
        </div>
      </Section>

      <QuoteBand variant="mottak" lead="Ta kontakt i dag for et tilbud, eller hør hvordan vi kan hjelpe deg med bærekraftig massehåndtering. Vi finner den beste løsningen for ditt prosjekt." />
    </>
  );
}
