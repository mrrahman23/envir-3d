/**
 * Static soil profile (no WebGL / reduced motion): five bands cut from the same scanned
 * textures and irregular boundaries as the 3D cutaway, slightly separated, labelled beside.
 */
import type { CSSProperties } from "react";
import { BLOCK, boundary, GEOLOGY_URL, LAYERS } from "@/three/earth/layers";

const GAP = 0.13; // metres of separation between bands in the figure
const SAMPLES = 36;
const TOTAL = -BLOCK.bottom + GAP * (LAYERS.length - 1) + 0.04;

function band(i: number) {
  // Front face (z = +d/2) of slab i, in figure metres from the top.
  const xs = Array.from({ length: SAMPLES + 1 }, (_, k) => -BLOCK.w / 2 + (k / SAMPLES) * BLOCK.w);
  const top = xs.map((x) => boundary(i, x, BLOCK.d / 2));
  const bot = xs.map((x) => boundary(i + 1, x, BLOCK.d / 2));
  const yMax = Math.max(...top);
  const yMin = Math.min(...bot);
  const h = yMax - yMin;
  const offset = 0.02 - yMax + i * GAP;
  const r = (v: number) => Math.round(v * 100) / 100;
  const pt = (k: number, y: number) => `${r((k / SAMPLES) * 100)}% ${r(((yMax - y) / h) * 100)}%`;
  const poly = [...top.map((y, k) => pt(k, y)), ...bot.map((y, k) => pt(k, y)).reverse()].join(",");
  return { top: r((offset / TOTAL) * 100), height: r((h / TOTAL) * 100), mid: r(((offset + (yMax - (top[SAMPLES / 2] + bot[SAMPLES / 2]) / 2)) / TOTAL) * 100), poly };
}

const BANDS = LAYERS.map((_, i) => band(i));
// Label anchors: centred on each band, but never closer than LABEL_GAP % to the one above.
const LABEL_GAP = 17;
const LABEL_TOPS = BANDS.reduce<number[]>((acc, b, i) => [...acc, i ? Math.max(b.mid, acc[i - 1] + LABEL_GAP) : Math.max(b.mid, 3)], []);

/** `labelled`: render the visible ordered list (static mode). Otherwise decorative only. */
export default function StaticStrata({ labelled = true, className = "" }: { labelled?: boolean; className?: string }) {
  return (
    <figure className={`relative ${className}`} aria-hidden={labelled ? undefined : true}>
      <div className="relative grid gap-6 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] sm:gap-10">
        <div className="relative aspect-[4/5] w-full max-sm:mx-auto max-sm:max-w-[20rem]">
          {/* soft contact shadow */}
          <div aria-hidden className="absolute inset-x-[4%] -bottom-3 h-6 rounded-[50%] bg-black/45 blur-md" />
          {LAYERS.map((l, i) => {
            const b = BANDS[i];
            const style: CSSProperties = {
              top: `${b.top}%`,
              height: `${b.height}%`,
              clipPath: `polygon(${b.poly.replaceAll(",", ", ")})`,
              backgroundColor: l.colour,
              backgroundImage:
                i === 0
                  ? `linear-gradient(180deg, rgba(92,96,46,0.9) 0%, rgba(92,96,46,0) 14%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25)), url(${GEOLOGY_URL}/${l.id}-albedo-512.webp)`
                  : `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 22%), linear-gradient(90deg, rgba(255,255,255,0.05), rgba(0,0,0,0.22)), url(${GEOLOGY_URL}/${l.id}-albedo-512.webp)`,
              backgroundSize: `100% 100%, 100% 100%, ${Math.round(l.tile * 150)}px auto`,
            };
            if (l.id === "bedrock") style.filter = "saturate(0.35) brightness(1.05)";
            return <div key={l.id} aria-hidden className="absolute inset-x-0" style={style} />;
          })}
        </div>
        {labelled ? (
          <ol className="relative max-sm:space-y-4">
            {LAYERS.map((l, i) => (
              <li key={l.id} className="relative pl-6 sm:absolute sm:left-0 sm:right-0 sm:-translate-y-1/2" style={{ top: `${LABEL_TOPS[i]}%` }}>
                <span aria-hidden className="absolute left-0 top-[0.7em] h-px w-4 bg-lime/80" />
                <span className="display block text-[0.95rem] font-semibold text-white sm:text-[1.05rem]">{l.name}</span>
                <span className="mt-0.5 block text-[0.78rem] leading-snug text-white/70 sm:text-[0.85rem]">{l.line}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div />
        )}
      </div>
      {/* The decorative copy (under the canvas) sits beside the story's own caption and credits. */}
      {labelled && (
        <figcaption className="mt-6 text-[0.68rem] uppercase tracking-[0.18em] text-white/75">
          Skjematisk jordprofil – ikke i målestokk · Teksturer: Poly Haven (CC0)
        </figcaption>
      )}
    </figure>
  );
}
