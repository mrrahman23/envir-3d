import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import ContactForm from "./ContactForm";
import { ArrowIcon, Eyebrow, Icon } from "./ui";
import type { Variant } from "@/lib/contact";

/** Cinematic dark hero for inner pages, built on official Envir photography. */
export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  imageAlt = "",
  stats,
  children,
  position = "center",
}: {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  image?: string;
  imageAlt?: string;
  stats?: { v: string; l: string }[];
  children?: ReactNode;
  position?: string;
}) {
  return (
    <section className="grain relative isolate overflow-hidden bg-night text-white">
      {image && (
        <Image src={image} alt={imageAlt} fill preload sizes="100vw" quality={70} className="-z-10 object-cover opacity-50" style={{ objectPosition: position }} />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,24,26,0.95)_0%,rgba(7,24,26,0.7)_45%,rgba(7,24,26,0.35)_100%),linear-gradient(180deg,rgba(7,24,26,0)_60%,#07181a_100%)]" />
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-[calc(var(--nav-h)+3.5rem)] sm:px-6 lg:px-10 lg:pb-24 lg:pt-[calc(var(--nav-h)+5.5rem)]">
        <Link href="/" className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
          <ArrowIcon className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
          Tilbake til forsiden
        </Link>
        <Eyebrow className="mt-10 text-lime">{eyebrow}</Eyebrow>
        <h1 className="display hero-rise mt-6 max-w-5xl text-[clamp(2.6rem,6.4vw,6rem)] text-balance">{title}</h1>
        {lead && <div className="hero-in mt-6 max-w-2xl text-lg leading-relaxed text-white/75" style={{ animationDelay: "0.15s" }}>{lead}</div>}
        {stats && (
          <dl className="hero-in mt-12 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-3" style={{ animationDelay: "0.3s" }}>
            {stats.map((s) => (
              <div key={s.l}>
                <dt className="sr-only">{s.l}</dt>
                <dd className="display text-[clamp(2rem,4vw,3.2rem)] leading-none text-lime">{s.v}</dd>
                <dd className="mt-2 text-sm text-white/60">{s.l}</dd>
              </div>
            ))}
          </dl>
        )}
        {children && <div className="hero-in mt-10 flex flex-wrap gap-3" style={{ animationDelay: "0.35s" }}>{children}</div>}
      </div>
    </section>
  );
}

export function Section({ children, tone = "paper", className = "", id, labelledBy }: { children: ReactNode; tone?: "paper" | "sand" | "dark" | "white"; className?: string; id?: string; labelledBy?: string }) {
  const t = { paper: "bg-paper text-graphite on-light", sand: "bg-paper-200 text-graphite on-light", white: "bg-white text-graphite on-light", dark: "bg-forest-950 text-white" }[tone];
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${t} py-20 lg:py-28 ${className}`}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">{children}</div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, lead, id, dark }: { eyebrow?: string; title: string; lead?: ReactNode; id?: string; dark?: boolean }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <Eyebrow className={dark ? "text-lime" : "text-emerald-700"}>{eyebrow}</Eyebrow>}
      <h2 id={id} className={`display mt-5 text-[clamp(2rem,4vw,3.6rem)] text-balance ${dark ? "" : "text-forest-950"}`} data-reveal>
        {title}
      </h2>
      {lead && (
        <div className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/70" : "text-graphite/75"}`} data-reveal>
          {lead}
        </div>
      )}
    </div>
  );
}

export function Steps({ steps, dark }: { steps: { n?: string; title: string; text: string }[]; dark?: boolean }) {
  return (
    <ol className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-current/10 bg-current/10 md:grid-cols-2">
      {steps.map((s, i) => (
        <li key={s.title} className={`p-7 sm:p-9 ${dark ? "bg-forest-950" : "bg-paper"}`} data-reveal data-reveal-delay={String(i * 70)}>
          <span className={`display text-[3rem] leading-none ${dark ? "text-lime" : "text-emerald-700"}`}>{s.n ?? String(i + 1).padStart(2, "0")}</span>
          <h3 className={`display mt-5 text-2xl ${dark ? "" : "text-forest-950"}`}>{s.title}</h3>
          <p className={`mt-3 leading-relaxed ${dark ? "text-white/70" : "text-graphite/75"}`}>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function Cards({ items, cols = 3 }: { items: { title: string; text: string; href?: string }[]; cols?: 2 | 3 | 4 }) {
  const c = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <ul className={`mt-12 grid gap-4 ${c}`}>
      {items.map((it, i) => (
        <li key={it.title} data-reveal data-reveal-delay={String(i * 60)}>
          {it.href ? (
            <Link href={it.href} className="group block h-full rounded-[24px] border border-forest/10 bg-white p-7 transition-shadow hover:shadow-[0_30px_60px_-40px_rgba(0,65,55,0.5)]">
              <h3 className="display flex items-start justify-between gap-3 text-xl text-forest-950">
                {it.title}
                <ArrowIcon className="mt-1 h-4 w-4 shrink-0 text-forest transition-transform group-hover:translate-x-1" />
              </h3>
              <p className="mt-3 leading-relaxed text-graphite/70">{it.text}</p>
            </Link>
          ) : (
            <div className="h-full rounded-[24px] border border-forest/10 bg-white p-7">
              <h3 className="display text-xl text-forest-950">{it.title}</h3>
              <p className="mt-3 leading-relaxed text-graphite/70">{it.text}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Sales contact + request form, as on the original service pages. */
export function QuoteBand({ lead, variant }: { lead: string; variant: Variant }) {
  return (
    <section aria-labelledby="tilbud-title" className="on-light bg-paper-200 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-10">
        <div>
          <Eyebrow className="text-emerald-700">Salg og marked</Eyebrow>
          <h2 id="tilbud-title" className="display mt-5 text-[clamp(2rem,4vw,3.4rem)] text-forest-950">
            Ønsker du et tilbud?
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-graphite/75">{lead}</p>
          <div className="mt-10 flex items-center gap-5">
            <div className="relative h-24 w-24 overflow-hidden rounded-full">
              <Image src="/assets/team/nina_rebnord.jpg" alt="Nina Rebnord" fill sizes="96px" quality={70} className="object-cover" />
            </div>
            <div>
              <p className="font-semibold text-forest-950">Nina Rebnord</p>
              <p className="text-sm text-graphite/70">Leder salg og marked</p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <a href="tel:+4794842593" className="inline-flex items-center gap-2 text-forest hover:underline">
                  <Icon name="phone" className="h-4 w-4" /> +47 948 42 593
                </a>
                <a href="mailto:nina@envir.com" className="inline-flex items-center gap-2 text-forest hover:underline">
                  <Icon name="mail" className="h-4 w-4" /> nina@envir.com
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] bg-white p-6 sm:p-10">
          <h3 className="display text-2xl text-forest-950">Send en henvendelse</h3>
          <div className="mt-6">
            <ContactForm variant={variant} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ title, text, href = "/kontakt", cta = "Kontakt oss" }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <section className="grain relative overflow-hidden bg-forest-950 py-20 text-white lg:py-24">
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="max-w-2xl">
          <h2 className="display text-[clamp(2rem,4vw,3.4rem)] text-balance">{title}</h2>
          <p className="mt-4 text-lg text-white/70">{text}</p>
        </div>
        <Link href={href} className="inline-flex w-fit items-center gap-3 rounded-full bg-lime px-7 py-4 font-semibold text-forest-950 transition-colors hover:bg-[#c7e46c]">
          {cta}
          <ArrowIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function ContactStrip() {
  return (
    <dl className="mt-10 grid gap-6 rounded-[24px] border border-forest/10 bg-white p-7 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { l: "Telefon", v: "+47 55 200 400", href: "tel:+4755200400" },
        { l: "E-post", v: "post@envir.com", href: "mailto:post@envir.com" },
        { l: "Åpningstider", v: "Man–fre: 07:00–16:00 · Lør–søn: Stengt" },
        { l: "Adresse", v: "Sjøkrigsskoleveien 15, 5165 Laksevåg" },
      ].map((x) => (
        <div key={x.l}>
          <dt className="text-sm text-graphite/70">{x.l}</dt>
          <dd className="mt-1 font-semibold text-forest-950">{x.href ? <a href={x.href} className="hover:underline">{x.v}</a> : x.v}</dd>
        </div>
      ))}
    </dl>
  );
}
