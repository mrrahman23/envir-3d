import legal from "@/content/legal.json";
import { PageHero, Section } from "./page";

export default function LegalPage({ doc, eyebrow }: { doc: keyof typeof legal; eyebrow: string }) {
  const d = legal[doc];
  return (
    <>
      <PageHero eyebrow={eyebrow} title={d.title ?? eyebrow} lead={d.updated ?? undefined} />
      <Section>
        <div className="prose-envir max-w-[70ch] text-graphite">
          {d.blocks.map((b, i) => (b.t === "h" ? <h2 key={i}>{b.v}</h2> : <p key={i}>{b.v}</p>))}
        </div>
      </Section>
    </>
  );
}
