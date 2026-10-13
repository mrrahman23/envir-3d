import type { Metadata } from "next";
import { CtaBand, PageHero, Section, SectionHead } from "@/components/page";
import { ButtonLink } from "@/components/ui";
import { company, sustainability } from "@/content/site";

export const metadata: Metadata = {
  title: "Bærekraft og sirkulær økonomi",
  description: "LCA av Envirs jordvaskeprosess, BREEAM Infrastructure og FNs bærekraftsmål. Gjenvunne masser gir dokumentert lavere klimagassutslipp.",
  alternates: { canonical: "/baerekraft" },
};

export default function BaerekraftPage() {
  return (
    <>
      <PageHero eyebrow="Bærekraft" title="Vår bærekraft" lead={sustainability.intro} image="/assets/envir/hero-bg.webp" imageAlt="Envir-ansatt i anleggshallen" />

      <Section labelledBy="bakgrunn">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-5 text-lg leading-relaxed text-graphite/80" data-reveal>
            <h2 id="bakgrunn" className="display text-[clamp(2rem,4vw,3.2rem)] text-forest-950">
              Det grønne skiftet er også økonomisk smart.
            </h2>
            <p>
              Bygg- og anleggsbransjen står for 40 % av globale CO2-utslipp, energiforbruk og avfall. Denne utviklingen må snu, og nye lover fra EU, som også påvirker Norge, krever at minst 65 % av byggavfall skal gjenvinnes innen 2035. I dag ligger Norge på under 50 %, og for lett forurensede gravemasser er gjenvinningsgraden bare 1 %. Store norske byer som Oslo, Bergen, Stavanger og Trondheim har satt mål om å nå 65 % materialgjenvinning allerede innen 2030.
            </p>
            <p>
              Fra 1. januar 2024 må klima- og miljøhensyn vektes minst 30 % i offentlige anbud, og bærekraftsrapportering blir obligatorisk i selskapenes årsberetning. Selskaper som ikke følger disse kravene, vil ha vanskeligere for å vinne anbud og få finansiering.
            </p>
            <p>Ved å levere forurensede masser til gjenvinning og bruke gjenvunne masser, tar du et enkelt grep for å være med på det grønne skiftet – og det gir økonomisk gevinst.</p>
          </div>
          <dl className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-[28px] border border-forest/10 bg-forest/10">
            {sustainability.context.map((c) => (
              <div key={c.l} className="bg-paper p-7">
                <dt className="sr-only">{c.l}</dt>
                <dd className="display text-[clamp(2.4rem,4vw,3.6rem)] leading-none text-forest">{c.v}</dd>
                <dd className="mt-3 text-sm text-graphite/65">{c.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section tone="dark" labelledBy="lca">
        <SectionHead
          dark
          eyebrow="Livsløpsanalyse"
          id="lca"
          title="LCA av Envirs jordvaskeprosess"
          lead="For å dokumentere og videre redusere vår miljøpåvirkning har Envir gjennomført en livsløpsanalyse (LCA) av jordvaskeprosessen. Analysen viser tydelige klimagevinster ved å behandle og gjenvinne forurensede gravemasser ved jordvasking fremfor å deponere dem og produsere nye, jomfruelige materialer."
        />
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {sustainability.lca.map((l) => (
            <li key={l.v} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-7" data-reveal>
              <p className="display text-[3.4rem] leading-none text-lime">−{l.v} %</p>
              <p className="mt-4 leading-relaxed text-white/75">{l.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 max-w-3xl space-y-4 leading-relaxed text-white/70">
          <p>Dette dokumenterer at Envirs prosess for gjenvinning av masser både reduserer avfallsmengder og bidrar vesentlig til lavere klimagassutslipp, i tillegg til at det reduserer behovet for nedbygging av natur.</p>
          <p>{sustainability.lcaMethod}</p>
          <p>
            For å skille mellom avfallsbehandling og produksjon av gjenvunne materialer er det definert et såkalt nullpunkt – tidspunktet der massene ikke lenger regnes som avfall, men som produkter. Hos Envir er dette definert som tidspunktet der massene har forlatt transportbåndet etter siste sorteringstrinn og gått ned i mellomlagringsbåsene.
          </p>
          <p>
            I denne omgang ble det valgt å gjennomføre en LCA som dekker de samme miljøpåvirknings-kategoriene som en EPD (Environmental Product Declaration). Resultatene kan benyttes direkte i klimagassregnskap. Når vårt nye sandblandeverk har vært i full drift i ett år, planlegger Envir å starte arbeidet med å utarbeide en fullverdig EPD for våre gjenvunne materialer.
          </p>
        </div>
        <div className="mt-8">
          <ButtonLink href={company.docs.lca}>Last ned LCA-rapporten (PDF)</ButtonLink>
        </div>
      </Section>

      <Section labelledBy="breeam">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="Sertifisering" id="breeam" title="BREEAM Infrastructure og Envir" />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-graphite/80">
              <p>
                BREEAM Infrastructure er et internasjonalt anerkjent system for å dokumentere og styrke bærekraft i anleggsprosjekter. Det er et strukturert rammeverk for å jobbe systematisk med klima, miljø, ressursbruk og samfunn, og har blitt populært i Norge de siste årene.
              </p>
              <p>
                For prosjekter med ambisjon om sertifisering etter BREEAM Infrastructure er det avgjørende å etablere gode løsninger for massehåndtering, materialbruk og dokumentasjon allerede i tidligfase – og å følge dette opp i gjennomføringen. Her kan Envir bistå. Våre dyktige miljørådgivere har erfaring med BREEAM Infrastructure og kan bistå med å synliggjøre hvilke positive virkninger vår avfallsbehandling og gjenvunne produkter gir for sertifiseringen av ditt prosjekt.
              </p>
            </div>
          </div>
          <div className="grid gap-4 self-start">
            {[
              {
                t: "Tidligfase og designfase",
                l: [
                  "Innspill til bærekraftige løsninger for håndtering av både rene og forurensede masser",
                  "Løsninger for gjenvinning, gjenbruk og ressursutnyttelse",
                  "Samarbeid for å kartlegge hvilke kriterier Envir kan støtte opp under og utarbeidelse av nødvendig dokumentasjon",
                ],
              },
              {
                t: "Anleggsfase",
                l: [
                  "Sentralt mottak for håndtering av gravemasser",
                  "Sentralt utsalg av gjenvunne sirkulære kvalitetsprodukter",
                  "Sporbarhet og strukturert dokumentasjon tilpasset prosjektets behov",
                  "Mulighet for transport via sjøvei (vi har ISPS-godkjent kai)",
                ],
              },
            ].map((b) => (
              <div key={b.t} className="rounded-[24px] border border-forest/10 bg-white p-7">
                <h3 className="display text-xl text-forest-950">{b.t}</h3>
                <ul className="mt-4 space-y-2.5">
                  {b.l.map((x) => (
                    <li key={x} className="flex gap-3 text-graphite/80">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="sand" labelledBy="fn">
        <SectionHead
          eyebrow="FNs bærekraftsmål"
          id="fn"
          title="Fire mål vi bidrar spesielt til"
          lead="FNs bærekraftsmål fra 2015 er en global plan for å utrydde fattigdom, beskytte planeten og sikre velstand innen 2030. Envir bidrar spesielt til fire av målene:"
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sustainability.sdg.map((g) => (
            <li key={g.n} className="rounded-[24px] bg-white p-7" data-reveal>
              <p className="eyebrow text-emerald-700">Mål {g.n}</p>
              <p className="display mt-4 text-[4rem] leading-none text-forest">{g.n}</p>
              <h3 className="mt-4 font-semibold text-forest-950">{g.t}</h3>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand title="Bli med på det grønne skiftet" text="Ta kontakt for å lære mer om hvordan gjenvunne masser kan gi deg både økonomisk og miljømessig gevinst." />
    </>
  );
}
