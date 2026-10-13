import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { PageHero, Section } from "@/components/page";
import { Icon } from "@/components/ui";
import { company, contacts } from "@/content/site";

export const metadata: Metadata = {
  title: "Kontakt oss | Envir AS",
  description: "Kontakt Envir om massemottak, gjenvunne masser eller tilbud. Sjøkrigsskoleveien 15, 5165 Laksevåg. Telefon +47 55 200 400, post@envir.com.",
  alternates: { canonical: "/kontakt" },
};

export default function KontaktPage() {
  return (
    <>
      <PageHero eyebrow="Kontakt" title="Ta kontakt med oss" lead="Har du spørsmål om massemottak, gjenvunne masser eller ønsker et tilbud? Vi hjelper deg gjerne." />
      <Section labelledBy="personer">
        <h2 id="personer" className="sr-only">
          Kontaktpersoner
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {contacts.map((c) => (
            <li key={c.name} className="overflow-hidden rounded-[24px] border border-forest/10 bg-white">
              <div className="relative aspect-square">
                <Image src={c.image} alt={c.name} fill sizes="(min-width:1024px) 20vw, (min-width:640px) 50vw, 100vw" quality={70} className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-forest-950">{c.name}</h3>
                <p className="text-sm text-graphite/70">{c.role}</p>
                <div className="mt-4 space-y-1.5 text-sm">
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-forest hover:underline">
                    <Icon name="phone" className="h-4 w-4 shrink-0" /> {c.phone}
                  </a>
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 break-all text-forest hover:underline">
                    <Icon name="mail" className="h-4 w-4 shrink-0" /> {c.email}
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href="/team" className="font-semibold text-forest underline underline-offset-4">
            Møt alle våre ansatte
          </Link>
        </p>
      </Section>
      <Section tone="sand" labelledBy="melding">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="melding" className="display text-[clamp(2rem,4vw,3.2rem)] text-forest-950">
              Send oss en melding
            </h2>
            <p className="mt-4 text-lg text-graphite/75">Fyll ut skjemaet, så tar vi kontakt med deg så snart som mulig.</p>
            <dl className="mt-10 space-y-6">
              {[
                { i: "phone" as const, l: "Telefon", v: company.phone, href: company.phoneHref },
                { i: "mail" as const, l: "E-post", v: company.email, href: `mailto:${company.email}` },
                { i: "pin" as const, l: "Adresse", v: `${company.address}, ${company.postal}`, href: company.mapsUrl },
                { i: "clock" as const, l: "Åpningstider", v: "Man–Fre 07:00–16:00" },
              ].map((x) => (
                <div key={x.l} className="flex gap-4">
                  <Icon name={x.i} className="mt-1 h-5 w-5 text-emerald-700" />
                  <div>
                    <dt className="text-sm text-graphite/70">{x.l}</dt>
                    <dd className="text-lg font-semibold text-forest-950">
                      {x.href ? (
                        <a href={x.href} className="hover:underline" {...(x.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                          {x.v}
                        </a>
                      ) : (
                        x.v
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-[28px] bg-white p-6 sm:p-10">
            <ContactForm submitLabel="Send melding" />
          </div>
        </div>
      </Section>
      <Section labelledBy="finn">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-center">
          <div>
            <h2 id="finn" className="display text-[clamp(2rem,4vw,3.2rem)] text-forest-950">
              Finn oss
            </h2>
            <p className="mt-4 text-lg text-graphite/75">Vi holder til på Laksevåg, ca. 8 minutter fra Bergen sentrum.</p>
            <a href={company.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 font-semibold text-forest underline underline-offset-4">
              Åpne i Google Maps
            </a>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] border border-forest/10 bg-paper-200">
            <iframe
              title="Kart: Sjøkrigsskoleveien 15, 5165 Laksevåg"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1969.5!2d5.2665967!3d60.38916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x463cfc79e02eed01%3A0x94220c64adb103ec!2sSj%C3%B8krigsskoleveien%2015%2C%205165%20Laksev%C3%A5g!5e0!3m2!1sno!2sno!4v1700000000000"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </Section>
    </>
  );
}
