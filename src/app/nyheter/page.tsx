import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero, Section } from "@/components/page";
import { ArrowUpRight, SocialIcon, formatDate } from "@/components/ui";
import { company } from "@/content/site";
import posts from "@/content/posts.json";

export const metadata: Metadata = {
  title: "Nyheter & innsikt",
  description: "Les siste nytt om sirkulær massehåndtering, bærekraft i bygg- og anleggsbransjen, og hva som skjer hos Envir.",
  alternates: { canonical: "/nyheter" },
};

export default function NyheterPage() {
  return (
    <>
      <PageHero eyebrow="Aktuelt" title="Nyheter og innsikt" lead="Les siste nytt om sirkulær massehåndtering, bærekraft i bygg- og anleggsbransjen, og hva som skjer hos Envir." />
      <Section labelledBy="artikler">
        <h2 id="artikler" className="sr-only">
          Artikler
        </h2>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <li key={p.slug} className={i === 0 ? "md:col-span-2" : ""} data-reveal>
              <Link href={`/blogg/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-forest/10 bg-white transition-shadow hover:shadow-[0_30px_60px_-40px_rgba(0,65,55,0.5)]">
                <div className={`relative overflow-hidden ${i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
                  <Image src={p.image} alt="" fill sizes={i === 0 ? "(min-width:768px) 66vw, 100vw" : "(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"} quality={70} className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-cine)] group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="text-xs text-graphite/70">
                    <span className="font-semibold text-emerald-700">{p.tag}</span> · <time dateTime={p.date}>{formatDate(p.date)}</time>
                  </p>
                  <h3 className={`display mt-3 text-forest-950 text-balance ${i === 0 ? "text-[clamp(1.6rem,2.6vw,2.4rem)]" : "text-xl"}`}>{p.title}</h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-[0.95rem] leading-relaxed text-graphite/70">{p.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-forest">
                    Les mer <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="sand" labelledBy="sosiale">
        <h2 id="sosiale" className="display text-[clamp(2rem,4vw,3.2rem)] text-forest-950">
          Følg oss i sosiale medier
        </h2>
        <p className="mt-3 text-lg text-graphite/75">Hold deg oppdatert på siste nytt, prosjekter og innsikt fra Envir.</p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {company.social.map((s, i) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="group flex h-full items-start gap-4 rounded-[24px] bg-white p-7 transition-shadow hover:shadow-[0_30px_60px_-40px_rgba(0,65,55,0.5)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-paper">
                  <SocialIcon name={s.label} />
                </span>
                <span>
                  <span className="block font-semibold text-forest-950">{s.label}</span>
                  <span className="block text-sm text-graphite/70">{s.handle}</span>
                  <span className="mt-2 block text-sm text-graphite/70">{["Nyheter, arrangementer og oppdateringer", "Bilder fra hverdagen og prosjektene våre", "Faglige artikler og bransjenyheter"][i]}</span>
                </span>
                <span className="sr-only">(åpnes i ny fane)</span>
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
