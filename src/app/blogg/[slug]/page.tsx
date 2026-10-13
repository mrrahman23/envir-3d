import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import ContactForm from "@/components/ContactForm";
import { ArrowIcon, formatDate } from "@/components/ui";
import posts from "@/content/posts.json";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blogg/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blogg/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, images: [{ url: post.image }], publishedTime: post.date },
  };
}

/** Turns "label (https://…)" in the CMS text into links. */
function linkify(text: string): ReactNode[] {
  const parts = text.split(/(\S[^()]*?\s\((?:https?:\/\/)[^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^(.*?)\s\(((?:https?:\/\/)[^)]+)\)$/);
    if (!m) return part;
    const [, label, url] = m;
    const internal = url.replace(/^https?:\/\/(www\.)?envir\.com/, "");
    const words = label.split(" ");
    const tail = words.slice(-2).join(" ");
    const head = words.slice(0, -2).join(" ");
    const href = internal.startsWith("/") ? internal : url;
    return (
      <span key={i}>
        {head}{" "}
        {href.startsWith("/") ? (
          <Link href={href}>{tail}</Link>
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {tail}
          </a>
        )}
      </span>
    );
  });
}

export default async function BlogPost({ params }: PageProps<"/blogg/[slug]">) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const more = posts.filter((p) => p.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    datePublished: post.date,
    image: post.image,
    publisher: { "@type": "Organization", name: "Envir AS" },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="grain relative bg-night pb-16 pt-[calc(var(--nav-h)+3rem)] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/nyheter" className="group inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowIcon className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
            Tilbake til nyheter
          </Link>
          <p className="mt-10 text-sm text-white/65">
            <span className="mr-3 rounded-full bg-lime px-2.5 py-1 text-xs font-semibold text-forest-950">{post.tag}</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </p>
          <h1 className="display hero-rise mt-6 text-[clamp(2.2rem,5vw,4.2rem)] text-balance">{post.title}</h1>
        </div>
      </header>
      <div className="on-light bg-paper pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <figure className="-mt-2 overflow-hidden rounded-[28px]">
            <div className="relative aspect-[16/9]">
              <Image src={post.image} alt={post.caption ?? post.title} fill preload sizes="(min-width:1024px) 960px, 100vw" quality={80} className="object-cover" />
            </div>
            {post.caption && <figcaption className="mt-3 text-sm text-graphite/70">{post.caption}</figcaption>}
          </figure>
          <div className="prose-envir mx-auto mt-12 max-w-[68ch] text-graphite">
            {post.blocks.map((b, i) =>
              b.t === "h" ? (
                <h2 key={i}>{b.v as string}</h2>
              ) : b.t === "ul" ? (
                <ul key={i}>
                  {(b.v as string[]).map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{linkify(b.v as string)}</p>
              ),
            )}
          </div>
        </div>
      </div>
      <section aria-labelledby="flere" className="on-light bg-paper-200 py-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <h2 id="flere" className="display text-[clamp(1.8rem,3vw,2.6rem)] text-forest-950">
            Flere artikler
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blogg/${p.slug}`} className="group block overflow-hidden rounded-[24px] bg-white">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={p.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" quality={70} className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-graphite/70">
                      <span className="font-semibold text-emerald-700">{p.tag}</span> · {formatDate(p.date)}
                    </p>
                    <h3 className="display mt-2 text-lg text-forest-950">{p.title}</h3>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section aria-labelledby="kontakt-blogg" className="on-light bg-paper py-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <h2 id="kontakt-blogg" className="display text-[clamp(1.8rem,3vw,2.6rem)] text-forest-950">
              Ta kontakt med oss
            </h2>
            <p className="mt-3 text-lg text-graphite/75">Har du spørsmål om våre tjenester, priser eller leveranser? Fyll ut skjemaet så tar vi kontakt innen én virkedag.</p>
          </div>
          <div className="rounded-[28px] bg-white p-6 sm:p-10">
            <ContactForm />
          </div>
        </div>
      </section>
    </article>
  );
}
