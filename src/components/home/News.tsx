import Image from "next/image";
import Link from "next/link";
import posts from "@/content/posts.json";
import { ArrowUpRight, Eyebrow, TextLink, formatDate } from "@/components/ui";

export default function News() {
  const [feature, ...rest] = posts.slice(0, 4);
  return (
    <section aria-labelledby="news-title" className="on-light bg-paper py-24 lg:py-36">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="text-emerald-700">Aktuelt</Eyebrow>
            <h2 id="news-title" className="display mt-6 text-[clamp(2.4rem,5vw,4.6rem)] text-forest-950" data-reveal>
              Nyheter og innsikt
            </h2>
          </div>
          <TextLink href="/nyheter" className="text-forest">
            Se alle artikler
          </TextLink>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Link href={`/blogg/${feature.slug}`} className="group relative overflow-hidden rounded-[32px] bg-night text-white lg:col-span-7 lg:row-span-3" data-reveal>
            <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[640px]">
              <Image src={feature.image} alt="" fill sizes="(min-width:1024px) 58vw, 100vw" quality={70} className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-cine)] group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,24,26,0)_30%,rgba(7,24,26,0.9)_100%)]" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
              <p className="text-sm text-white/70">
                <span className="mr-3 rounded-full bg-lime px-2.5 py-1 text-xs font-semibold text-forest-950">{feature.tag}</span>
                <time dateTime={feature.date}>{formatDate(feature.date)}</time>
              </p>
              <h3 className="display mt-5 max-w-2xl text-[clamp(1.8rem,3.2vw,3rem)] text-balance">{feature.title}</h3>
              <p className="mt-4 line-clamp-2 max-w-xl text-white/70">{feature.excerpt}</p>
            </div>
            <ArrowUpRight className="absolute right-7 top-7 h-8 w-8 text-white/70 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-lime" />
          </Link>

          {rest.map((p, i) => (
            <Link
              key={p.slug}
              href={`/blogg/${p.slug}`}
              className={`group grid grid-cols-[120px_1fr] gap-5 rounded-[24px] border border-forest/10 bg-white p-4 transition-shadow duration-500 hover:shadow-[0_30px_60px_-40px_rgba(0,65,55,0.5)] sm:grid-cols-[180px_1fr] lg:col-span-5`}
              data-reveal
              data-reveal-delay={String(80 + i * 80)}
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image src={p.image} alt="" fill sizes="180px" quality={70} className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-cine)] group-hover:scale-110" />
              </div>
              <div className="flex min-w-0 flex-col justify-between py-1">
                <div>
                  <p className="text-xs text-graphite/70">
                    <span className="font-semibold text-emerald-700">{p.tag}</span> · <time dateTime={p.date}>{formatDate(p.date)}</time>
                  </p>
                  <h3 className="display mt-3 text-[1.25rem] leading-tight text-forest-950 text-balance sm:text-[1.45rem]">{p.title}</h3>
                </div>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-forest">
                  Les mer
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
