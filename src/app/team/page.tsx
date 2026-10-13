import Image from "next/image";
import type { Metadata } from "next";
import { CtaBand, PageHero, Section } from "@/components/page";
import { team } from "@/content/site";

export const metadata: Metadata = {
  title: "Mennesker | Vårt team",
  description: "Bli kjent med menneskene som driver Norges mest avanserte anlegg for gjenvinning av forurensede masser.",
  alternates: { canonical: "/team" },
};

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Mennesker"
        title="Vårt team"
        lead="Bli kjent med menneskene som driver Norges mest avanserte anlegg for gjenvinning av forurensede masser."
        image="/assets/envir/ansatte.webp"
        imageAlt="En Envir-ansatt på en plattform i anleggshallen"
      />
      <Section labelledBy="ansatte">
        <h2 id="ansatte" className="sr-only">
          Ansatte
        </h2>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {team.map((p, i) => (
            <li key={p.name} data-reveal data-reveal-delay={String((i % 4) * 60)}>
              <div className="group relative aspect-[4/5] overflow-hidden rounded-[22px] bg-paper-200">
                <Image src={p.image} alt={p.name} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" quality={70} className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-cine)] group-hover:scale-105" />
              </div>
              <p className="mt-4 font-semibold text-forest-950">{p.name}</p>
              <p className="text-sm text-graphite/70">{p.role}</p>
            </li>
          ))}
        </ul>
      </Section>
      <CtaBand title="Vil du bli en del av teamet?" text="Vi er alltid på utkikk etter dyktige folk. Ta kontakt for å høre om ledige stillinger." />
    </>
  );
}
