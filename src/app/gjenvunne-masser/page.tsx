import type { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";
import { PageHero, QuoteBand, Section, SectionHead } from "@/components/page";
import { ButtonLink } from "@/components/ui";
import { company, priceNote } from "@/content/site";

export const metadata: Metadata = {
  title: "Gjenvunne masser | Rene produkter til gjenbruk",
  description: "CE-merket pukk, singel, grus, kabelsand og anleggsjord fra Envirs anlegg på Laksevåg. Vasket, sortert og kvalitetssikret gjennom eget laboratorium.",
  alternates: { canonical: "/gjenvunne-masser" },
};

// Selling points from envir.com. Numeric claims without a published source (cost / transport)
// are intentionally not shown; the CO₂ figure cites the published LCA instead.
const why = [
  { stat: "−74 %", statLabel: "klimagassutslipp ifølge LCA*", title: "Bedre for CO₂-regnskapet", text: "Gjenvunne masser gir betydelig lavere klimaavtrykk enn jomfruelige masser – dokumentert gjennom EPD og LCA." },
  { title: "Skaper lønnsomhet", text: "Konkurransedyktige priser og reduserte deponikostnader gjør gjenvunne masser til et smart økonomisk valg." },
  { title: "Lever og hent i én tur", text: "Kom med masser til mottak og dra med et rent, gjenvunnet lass tilbake. Spar tid, drivstoff og transport." },
  { stat: "<10 min", statLabel: "fra Bergen sentrum", title: "Sentrumsnært anlegg", text: "Vårt anlegg på Laksevåg gir kort transportvei til prosjekter i Bergen og omegn." },
  { stat: "30 %", statLabel: "miljøvekting i anbud", title: "Bedre miljørapportering", text: "Dokumenterte gjenvunne masser forenkler CO₂-rapportering og oppfyller krav i offentlige anbud." },
  { title: "CE-merket kvalitet", text: "Alle produkter er vasket, sortert og kvalitetssikret gjennom vårt eget laboratorium – klare til bruk." },
];

export default function GjenvunneMasserPage() {
  return (
    <>
      <PageHero
        eyebrow="Salg av gjenvunne masser"
        title="Gjenvunne masser"
        lead="CE-merkede gjenvunne masser fra vårt anlegg på Laksevåg. Alle produkter er vasket, sortert og kvalitetssikret gjennom vårt laboratorium."
        image="/assets/envir/gjenvunne-masser.jpg"
        imageAlt="Hauger av vasket sand i Envirs anleggshall"
      >
        <ButtonLink href="#produkter">Se produktene</ButtonLink>
        <ButtonLink href={company.docs.prisliste} tone="ghost-light">
          Prisliste (PDF)
        </ButtonLink>
      </PageHero>

      <Section id="produkter" labelledBy="produkter-title">
        <SectionHead eyebrow="Produkter" id="produkter-title" title="Fraksjoner fra 0 til 90 mm" />
        <div className="mt-10">
          <ProductGrid />
        </div>
        <p className="mt-8 text-sm text-graphite/70">{priceNote} Se full prisliste for detaljer.</p>
      </Section>

      <Section tone="dark" labelledBy="hvorfor">
        <SectionHead dark id="hvorfor" eyebrow="Fordeler" title="Hvorfor velge gjenvunne masser?" lead="Smartere, grønnere og mer lønnsomt – for både prosjektet og miljøet." />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {why.map((w) => (
            <li key={w.title} className="bg-forest-950 p-8" data-reveal>
              {w.stat && (
                <p className="mb-5">
                  <span className="display text-[2.6rem] leading-none text-lime">{w.stat}</span>
                  <span className="ml-2 text-sm text-white/55">{w.statLabel}</span>
                </p>
              )}
              <h3 className="display text-xl">{w.title}</h3>
              <p className="mt-3 leading-relaxed text-white/70">{w.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-white/50">
          * Produksjon av gjenvunne materialer hos Envir sammenlignet med produksjon av jomfruelige materialer. LCA utført av NORSUS, april 2026.{" "}
          <a href={company.docs.lca} className="underline underline-offset-2">
            Les LCA-rapporten
          </a>
          .
        </p>
      </Section>

      <QuoteBand variant="salg" lead="Ta kontakt for et tilbud på gjenvunne masser. Vi finner den beste løsningen for ditt prosjekt." />
    </>
  );
}
