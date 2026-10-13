/**
 * Technical diagrams built only from verified envir.com process descriptions.
 * Each renders as an SVG (desktop) with a matching ordered list (mobile / text
 * alternative), so the content is identical for every reader.
 */
import type { ReactNode } from "react";

type IconName = "truck" | "sieve" | "water" | "layers" | "press" | "landfill" | "loop" | "flask" | "doc" | "user" | "ship" | "site" | "factory" | "point";

export function ProcessIcon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const p: Record<IconName, ReactNode> = {
    truck: <path d="M3 7h10v8H3zM13 10h4l3 3v2h-7M6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
    sieve: <path d="M3 6h18l-3 6H6zM6 12l2 6h8l2-6M9 9h.01M12 9h.01M15 9h.01" />,
    water: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
    layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5" />,
    press: <path d="M4 5h16v4H4zM6 9v10M18 9v10M9 9v8M12 9v8M15 9v8M4 19h16" />,
    landfill: <path d="M3 19h18M5 19l4-7 3 4 2-3 5 6" />,
    loop: <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />,
    flask: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 15h9" />,
    doc: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />,
    ship: <path d="M3 17l2 4h14l2-4H3ZM6 17V11h12v6M9 11V7h6v4" />,
    site: <path d="M3 20h18M6 20V10l6-5 6 5v10M10 20v-5h4v5" />,
    factory: <path d="M3 20V9l5 3V9l5 3V5h8v15H3ZM7 16h2M12 16h2M17 16h2" />,
    point: <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12ZM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {p[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Shared SVG node                                                     */
/* ------------------------------------------------------------------ */

function Node({ x, y, w = 190, h = 92, icon, title, text, tone = "light" }: { x: number; y: number; w?: number; h?: number; icon: IconName; title: string; text: string; tone?: "light" | "lime" | "muted" | "dark" }) {
  const fill = { light: "#ffffff", lime: "#eef6d6", muted: "#ecebe5", dark: "#0a2420" }[tone];
  const fg = tone === "dark" ? "#ffffff" : "#0a2420";
  const sub = tone === "dark" ? "rgba(255,255,255,0.72)" : "rgba(32,39,35,0.72)";
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={16} fill={fill} stroke={tone === "dark" ? "none" : "rgba(0,65,55,0.16)"} />
      <foreignObject x={14} y={14} width={28} height={28}>
        <div style={{ color: tone === "dark" ? "#b9d95a" : "#006b52" }}>
          <ProcessIcon name={icon} className="h-7 w-7" />
        </div>
      </foreignObject>
      <text x={50} y={33} fontSize={13.5} fontWeight={600} fill={fg}>
        {title}
      </text>
      <foreignObject x={14} y={46} width={w - 28} height={h - 50}>
        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.35, color: sub }}>{text}</p>
      </foreignObject>
    </g>
  );
}

function Arrow({ d, dashed, color = "#004137", label, lx, ly }: { d: string; dashed?: boolean; color?: string; label?: string; lx?: number; ly?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeDasharray={dashed ? "5 5" : undefined} markerEnd={`url(#arrow-${color.replace("#", "")})`} />
      {label && (
        <text x={lx} y={ly} fontSize={11} fill={color} fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  );
}

function Markers({ colors }: { colors: string[] }) {
  return (
    <defs>
      {colors.map((c) => (
        <marker key={c} id={`arrow-${c.replace("#", "")}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill={c} />
        </marker>
      ))}
    </defs>
  );
}

function MobileList({ items }: { items: { icon: IconName; title: string; text: string; branch?: boolean }[] }) {
  return (
    <ol className="space-y-3 md:hidden">
      {items.map((it, i) => (
        <li key={i} className={`flex gap-3 rounded-2xl border border-forest/10 bg-white p-4 ${it.branch ? "ml-6 border-dashed bg-paper" : ""}`}>
          <span className="mt-0.5 text-emerald-700">
            <ProcessIcon name={it.icon} />
          </span>
          <span>
            <span className="block font-semibold text-forest-950">{it.title}</span>
            <span className="mt-1 block text-sm leading-snug text-graphite/75">{it.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Wash process (/jordvaskeanlegg)                                  */
/* ------------------------------------------------------------------ */

const WASH = [
  { icon: "truck", title: "Innveiing og inspeksjon", text: "Lastebilene veies inn og tipper i skitten sone. Operatørene sjekker massene." },
  { icon: "sieve", title: "Sortering", text: "Stein over 90 mm sorteres ut, knuses og mates tilbake i anlegget." },
  { icon: "water", title: "Vask og rensing", text: "Mekanisk vask med vann, uten tilsetning av kjemikalier." },
  { icon: "layers", title: "Finsortering", text: "Flere vaske- og sorteringstrinn. Rene masser sorteres etter størrelse." },
  { icon: "factory", title: "Rene fraksjoner", text: "Ligger et døgn og renner av seg før de selges ut." },
  { icon: "loop", title: "Plast og organisk", text: "Kvister, barnåler o.l. flyter opp og tas vekk.", branch: true },
  { icon: "press", title: "Slam → filterpresse", text: "Slammet med forurensningene tilsettes flokkuleringskjemikalie og presses.", branch: true },
  { icon: "landfill", title: "Filterkake til deponi", text: "Forurensningene forlater anlegget i filterkakene.", branch: true },
  { icon: "water", title: "Renset prosessvann", text: "Går tilbake til vaskeanlegget.", branch: true },
] as const;

export function WashProcessDiagram() {
  const top = WASH.slice(0, 5);
  return (
    <figure aria-labelledby="wash-diagram-cap">
      <svg viewBox="0 0 1180 450" className="hidden h-auto w-full md:block" role="img" aria-labelledby="wash-diagram-title wash-diagram-cap">
        <title id="wash-diagram-title">Prosessdiagram for jordvaskeanlegget</title>
        <Markers colors={["#004137", "#4a60ab", "#8c6c4e"]} />
        {top.map((n, i) => (
          <Node key={n.title} x={10 + i * 236} y={20} h={112} icon={n.icon} title={n.title} text={n.text} tone={i === 4 ? "dark" : i === 2 ? "lime" : "light"} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <Arrow key={i} d={`M${200 + i * 236} 76 H${244 + i * 236}`} />
        ))}
        {/* stone > 90 mm is crushed and fed back */}
        <Arrow d="M342 132 C342 172 270 172 238 140" dashed label="knust stein mates tilbake" lx={226} ly={184} />
        {/* branches from washing */}
        <Node x={520} y={214} w={190} h={82} icon="loop" title="Plast og organisk" text="Flyter opp og tas vekk." tone="muted" />
        <Arrow d="M600 132 V212" color="#8c6c4e" />
        <Node x={750} y={214} w={210} h={82} icon="press" title="Slam → filterpresse" text="Tilsatt flokkuleringskjemikalie, samlet i slambasseng." tone="muted" />
        <Arrow d="M640 132 C640 176 800 176 840 212" color="#8c6c4e" />
        <Node x={976} y={214} w={200} h={82} icon="landfill" title="Filterkake til deponi" text="Forurensningene forlater anlegget her." tone="muted" />
        <Arrow d="M960 255 H974" color="#8c6c4e" />
        <Node x={750} y={348} w={210} h={82} icon="water" title="Renset prosessvann" text="Går tilbake til vaskeanlegget." tone="light" />
        <Arrow d="M855 296 V346" color="#4a60ab" />
        {/* recirculated water runs left of the branch boxes, back up into the wash */}
        <Arrow d="M750 389 H486 Q470 389 470 373 V150 Q470 140 500 136" color="#4a60ab" dashed label="tilbake i vasken" lx={484} ly={412} />
      </svg>
      <MobileList items={[...WASH]} />
      <figcaption id="wash-diagram-cap" className="mt-4 text-sm text-graphite/70">
        Forurensningene fjernes ikke i ett enkelt trinn: de bindes i slammet og forlater anlegget som filterkake til deponi. Kilde: envir.com/jordvaskeanlegg.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Laboratory quality control (/laboratorium)                       */
/* ------------------------------------------------------------------ */

const LAB = [
  { icon: "truck", title: "Levert masse", text: "Prøver av massene som leveres til Envir." },
  { icon: "flask", title: "Kjemisk analyse", text: "Hva massene er forurenset med." },
  { icon: "user", title: "Tolkning", text: "Eksperter tolker og forklarer resultatene." },
  { icon: "point", title: "Riktig håndtering", text: "Den beste, korrekte og mest økonomiske løsningen." },
  { icon: "layers", title: "Gjenvunne masser", text: "Alle gjenvunne masser analyseres." },
  { icon: "sieve", title: "Geotekniske egenskaper", text: "Egenskapene til de gjenvunne massene." },
  { icon: "doc", title: "Testsertifikat", text: "Følger med ved kjøp av sand, singel, grus og pukk." },
  { icon: "ship", title: "TML-test", text: "Transport Moisture Limit for sikker transport med båt." },
] as const;

export function LabQualityDiagram() {
  return (
    <figure aria-labelledby="lab-diagram-cap">
      <svg viewBox="0 0 1000 330" className="hidden h-auto w-full md:block" role="img" aria-labelledby="lab-diagram-title lab-diagram-cap">
        <title id="lab-diagram-title">Laboratoriets to deler: analyse av levert masse og kvalitetskontroll av gjenvunne masser</title>
        <Markers colors={["#004137"]} />
        <text x={10} y={18} fontSize={11} fontWeight={700} letterSpacing={1.6} fill="#006b52">
          ANALYSE AV LEVERT MASSE
        </text>
        {LAB.slice(0, 4).map((n, i) => (
          <Node key={n.title} x={10 + i * 250} y={30} w={225} h={92} icon={n.icon} title={n.title} text={n.text} tone={i === 1 ? "lime" : "light"} />
        ))}
        {[0, 1, 2].map((i) => (
          <Arrow key={i} d={`M${235 + i * 250} 76 H${258 + i * 250}`} />
        ))}
        <text x={10} y={178} fontSize={11} fontWeight={700} letterSpacing={1.6} fill="#006b52">
          KVALITETSKONTROLL AV GJENVUNNE MASSER
        </text>
        {LAB.slice(4, 7).map((n, i) => (
          <Node key={n.title} x={10 + i * 250} y={190} w={225} h={92} icon={n.icon} title={n.title} text={n.text} tone={i === 2 ? "dark" : i === 1 ? "lime" : "light"} />
        ))}
        {[0, 1].map((i) => (
          <Arrow key={i} d={`M${235 + i * 250} 236 H${258 + i * 250}`} />
        ))}
        <Node x={760} y={190} w={225} h={92} icon="ship" title="TML-test" text="Transport Moisture Limit for sikker transport med båt." tone="muted" />
      </svg>
      <MobileList items={[...LAB]} />
      <figcaption id="lab-diagram-cap" className="mt-4 text-sm text-graphite/70">
        Laboratoriet ligger i den gamle hydraulikkhallen og er delt i to. Kilde: envir.com/laboratorium og envir.com/jordvaskeanlegg.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* 3. LCA system boundary (/baerekraft)                                */
/* ------------------------------------------------------------------ */

const LCA = [
  { icon: "site", title: "Graving på byggeplass", text: "Forurensede masser graves opp og leveres til Envir." },
  { icon: "water", title: "Avfallsbehandling", text: "Mottak, vask og sortering i jordvaskeanlegget." },
  { icon: "point", title: "Nullpunktet", text: "Massene har forlatt siste transportbånd og ligger i mellomlagringsbåsene – nå produkter, ikke avfall." },
  { icon: "factory", title: "Gjenvunne produkter", text: "Lastet på lastebil klar for utkjøring fra anlegget." },
  { icon: "truck", title: "Transport til byggeplass", text: "Ikke inkludert i analysen.", branch: true },
] as const;

export function LcaBoundaryDiagram() {
  return (
    <figure aria-labelledby="lca-diagram-cap">
      <svg viewBox="0 0 1180 250" className="hidden h-auto w-full md:block" role="img" aria-labelledby="lca-diagram-title lca-diagram-cap">
        <title id="lca-diagram-title">Systemgrensen for livsløpsanalysen av Envirs jordvaskeprosess</title>
        <Markers colors={["#b9d95a", "#8c918a"]} />
        <rect x={6} y={26} width={930} height={150} rx={22} fill="none" stroke="#b9d95a" strokeWidth={1.5} strokeDasharray="6 6" />
        <text x={24} y={18} fontSize={11} fontWeight={700} letterSpacing={1.6} fill="#b9d95a">
          INKLUDERT I LCA (NORSUS, 2026)
        </text>
        {LCA.slice(0, 4).map((n, i) => (
          <Node key={n.title} x={22 + i * 228} y={44} w={205} h={116} icon={n.icon} title={n.title} text={n.text} tone={i === 2 ? "lime" : "light"} />
        ))}
        {[0, 1, 2].map((i) => (
          <Arrow key={i} d={`M${227 + i * 228} 102 H${248 + i * 228}`} color="#b9d95a" />
        ))}
        <Node x={968} y={44} w={205} h={116} icon="truck" title="Transport videre" text="Fra anlegget til byggeplass eller produksjon – ikke inkludert." tone="muted" />
        <Arrow d="M936 102 H966" color="#8c918a" dashed />
        <text x={968} y={196} fontSize={11} fill="rgba(255,255,255,0.6)">
          Utenfor systemgrensen
        </text>
      </svg>
      <MobileList items={[...LCA]} />
      <figcaption id="lca-diagram-cap" className="mt-4 text-sm text-white/60">
        Analysen følger ISO 14040/14044 og EN 15804. Kilde: envir.com/baerekraft og LCA-rapporten (april 2026).
      </figcaption>
    </figure>
  );
}
