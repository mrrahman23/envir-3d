import Image from "next/image";
import type { Metadata } from "next";
import { Cards, PageHero, Section, SectionHead } from "@/components/page";
import ContactForm from "@/components/ContactForm";
import { ButtonLink } from "@/components/ui";
import { about } from "@/content/site";

export const metadata: Metadata = {
  title: "Om oss | Envir AS – gjenvinning av jord i Bergen",
  description: "Envir ble grunnlagt i 2017 og har et av verdens mest komplette anlegg for gjenvinning av forurenset jord og gravemasser, i Simonsviken på Laksevåg.",
  alternates: { canonical: "/om-oss" },
};

export default function OmOssPage() {
  return (
    <>
      <PageHero eyebrow="Om Envir" title={about.title} image="/assets/envir/hero-bg.webp" imageAlt="Envir-ansatt i anleggshallen" stats={[...about.facts]} />
      <Section labelledBy="historie-intro">
        <div className="grid gap-12 lg:grid-cols-2">
          <h2 id="historie-intro" className="display text-[clamp(2rem,4vw,3.2rem)] text-forest-950" data-reveal>
            Jord – en av de aller viktigste ressursene naturen gir oss.
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-graphite/80" data-reveal>
            <p>{about.text}</p>
            <p>{about.text2}</p>
          </div>
        </div>
      </Section>
      <Section tone="dark" labelledBy="historie">
        <SectionHead dark eyebrow="Vår historie" id="historie" title="Fra visjon til virkelighet" />
        <ol className="relative mt-14 space-y-10 border-l border-white/15 pl-8 lg:pl-12">
          {about.timeline.map((m) => (
            <li key={m.year} className="relative" data-reveal>
              <span aria-hidden className="absolute -left-[2.35rem] top-2 h-3 w-3 rounded-full bg-lime ring-4 ring-forest-950 lg:-left-[3.35rem]" />
              <p className="display text-[2.6rem] leading-none text-lime">{m.year}</p>
              <h3 className="display mt-3 text-2xl">{m.title}</h3>
              <p className="mt-2 max-w-2xl leading-relaxed text-white/70">{m.text}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section labelledBy="sitat">
        <figure className="grid items-center gap-8 lg:grid-cols-[auto_1fr] lg:gap-14">
          <div className="relative h-36 w-36 overflow-hidden rounded-full">
            <Image src={about.quote.image} alt={about.quote.name} fill sizes="144px" className="object-cover" />
          </div>
          <div>
            <h2 id="sitat" className="sr-only">
              Sitat
            </h2>
            <blockquote className="display text-[clamp(1.5rem,2.8vw,2.4rem)] font-medium leading-snug text-forest-950">«{about.quote.text}»</blockquote>
            <figcaption className="mt-6 text-graphite/70">
              <span className="font-semibold text-forest-950">{about.quote.name}</span> — {about.quote.role}
            </figcaption>
          </div>
        </figure>
      </Section>
      <Section tone="sand" labelledBy="anlegg">
        <SectionHead eyebrow="Våre anlegg" id="anlegg" title="Alt under ett tak" />
        <Cards
          cols={4}
          items={[
            { title: "Jordvaskeanlegg", text: "80% gjenvinningsgrad, inkludert rensing av fin sand.", href: "/jordvaskeanlegg" },
            { title: "Jorddampeanlegg", text: "100% fjerning av uønskede arter gjennom dampbehandling.", href: "/jorddampeanlegg" },
            { title: "ISPS-kai", text: "Tar imot båter opptil 5000 tonn for sjøtransport av masser.", href: "/isps-kai" },
            { title: "Laboratorium", text: "Avansert analyse og kvalitetskontroll av alle masser.", href: "/laboratorium" },
          ]}
        />
        <div className="mt-10">
          <ButtonLink href="/team" tone="forest">
            Møt menneskene i Envir
          </ButtonLink>
        </div>
      </Section>
      <Section labelledBy="kontakt-om">
        <div className="grid gap-10 lg:grid-cols-2">
          <SectionHead eyebrow="Kontakt" id="kontakt-om" title="Ta kontakt med oss" lead="Har du spørsmål om våre tjenester, priser eller leveranser? Fyll ut skjemaet så tar vi kontakt innen én virkedag." />
          <div className="rounded-[28px] bg-white p-6 sm:p-10">
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
