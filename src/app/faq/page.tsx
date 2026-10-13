import type { Metadata } from "next";
import { CtaBand, PageHero, Section } from "@/components/page";
import { faq } from "@/content/site";

export const metadata: Metadata = {
  title: "Ofte stilte spørsmål",
  description: "Alt du trenger å vite om mottak av forurensede masser, kjøp av gjenvunne sirkulære materialer, jordbehandling og laboratorieanalyse hos Envir i Bergen.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.flatMap((g) => g.items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } }))),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        eyebrow="FAQ"
        title="Ofte stilte spørsmål"
        lead="Alt du trenger å vite om mottak av forurensede masser, kjøp av gjenvunne sirkulære materialer, jordbehandling og laboratorieanalyse hos Envir i Bergen."
      />
      <Section>
        <div className="grid gap-14 lg:grid-cols-[280px_1fr]">
          <nav aria-label="Kategorier" className="lg:sticky lg:top-28 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col">
              {faq.map((g, i) => (
                <li key={g.group}>
                  <a href={`#faq-${i}`} className="block rounded-full border border-forest/15 px-4 py-2 text-sm font-medium text-forest-950 hover:border-forest/40 lg:rounded-xl">
                    {g.group}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-14">
            {faq.map((g, i) => (
              <div key={g.group}>
                <h2 id={`faq-${i}`} className="display scroll-mt-28 text-[clamp(1.8rem,3vw,2.6rem)] text-forest-950">
                  {g.group}
                </h2>
                <div className="mt-6 divide-y divide-forest/10 rounded-[24px] border border-forest/10 bg-white">
                  {g.items.map((it) => (
                    <details key={it.q} className="group px-6 py-1 sm:px-8">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-semibold text-forest-950 [&::-webkit-details-marker]:hidden">
                        {it.q}
                        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-forest/20 text-forest transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="pb-6 leading-relaxed text-graphite/75">{it.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <CtaBand title="Fant du ikke svaret?" text="Ring oss på +47 55 200 400 eller send en henvendelse, så hjelper vi deg." />
    </>
  );
}
