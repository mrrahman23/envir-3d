import { LAYERS } from "@/three/earth/layers";

export const FINAL_LINE = "Når vi graver, blir disse lagene til gravemasser. Det er her gjenvinningen begynner.";

export function GeologyHeading() {
  return (
    <>
      <p className="eyebrow flex items-center gap-3 text-lime">
        <span aria-hidden className="inline-block h-px w-8 bg-current" />
        Under overflaten
      </p>
      <h2 className="display mt-5 text-[clamp(2.1rem,4.2vw,3.8rem)] leading-[1.02] text-balance">Hva vi graver i.</h2>
      <p className="mt-5 max-w-[28rem] text-[1rem] leading-relaxed text-white/75 sm:text-[1.1rem]">
        Under gresset ligger lagene som bygger landskapet: matjord, sand, grus, steinmasser – og til slutt fast fjell.
      </p>
    </>
  );
}

/** The layer names and facts as real DOM text (visible in the static figure, sr-only beside the 3D labels). */
export function GeologyList({ className = "" }: { className?: string }) {
  return (
    <ol className={className} aria-label="Jordlag, fra overflaten og ned">
      {LAYERS.map((l) => (
        <li key={l.id}>
          {l.name} – {l.line}
        </li>
      ))}
    </ol>
  );
}
