import Link from "next/link";
import { company, footerNav } from "@/content/site";
import { Logo, SocialIcon } from "./ui";
import Footer3DToggle from "./Footer3DToggle";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-white/75">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-40 h-[480px] w-[480px] rounded-full bg-emerald/10 blur-[120px]" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-20 sm:px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo variant="white" className="w-[150px]" />
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-white/60">{company.tagline}</p>
            <div className="mt-8 flex gap-2">
              {company.social.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-lime hover:text-lime"
                >
                  <SocialIcon name={s.label} />
                  <span className="sr-only">{s.label} (åpnes i ny fane)</span>
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerNav).map(([title, links]) => (
            <div key={title}>
              <h2 className="eyebrow text-white/55">{title}</h2>
              <ul className="mt-5 space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="eyebrow text-white/55">Kontakt</h2>
            <address className="mt-5 space-y-3 not-italic">
              <a href={company.phoneHref} className="block transition-colors hover:text-white">
                {company.phone}
              </a>
              <a href={`mailto:${company.email}`} className="block transition-colors hover:text-white">
                {company.email}
              </a>
              <a href={company.mapsUrl} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-white">
                {company.address}
                <br />
                {company.postal}
              </a>
            </address>
            <h2 className="eyebrow mt-8 text-white/55">Åpningstider</h2>
            <dl className="mt-4 space-y-1.5 text-[0.95rem]">
              {company.hours.map((h) => (
                <div key={h.d} className="flex gap-3">
                  <dt className="w-20 text-white/50">{h.d}</dt>
                  <dd>{h.t}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-3">
          <a href={company.docs.brosjyre} className="rounded-full border border-white/15 px-4 py-2 text-sm transition-colors hover:border-white/40 hover:text-white">
            Se vår brosjyre (PDF)
          </a>
          <a href={company.docs.prisliste} className="rounded-full border border-white/15 px-4 py-2 text-sm transition-colors hover:border-white/40 hover:text-white">
            Prisliste 2026 (PDF)
          </a>
          <a href={company.docs.lca} className="rounded-full border border-white/15 px-4 py-2 text-sm transition-colors hover:border-white/40 hover:text-white">
            LCA-rapport (PDF)
          </a>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {2026} {company.name} · Org.nr. {company.orgnr}. Alle rettigheter reservert.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/faq" className="hover:text-white">
              FAQ
            </Link>
            <Link href="/personvern" className="hover:text-white">
              Personvern
            </Link>
            <Link href="/vilkar" className="hover:text-white">
              Vilkår
            </Link>
            <Footer3DToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
