import Image from "next/image";
import { products } from "@/content/site";

/**
 * Studio render of a recovered fraction (scanned-stone 3D, baked by scripts/render-assets.mjs).
 * Illustrations complement — never replace — the official product photos.
 */
export const RENDERED = ["0-2", "0-8", "0-16", "0-32", "2-8", "8-16", "16-32", "16-64", "32-64", "64-90"] as const;
export type RenderedId = (typeof RENDERED)[number];

export function MaterialRender({ id, className = "", sizes = "320px", priority }: { id: RenderedId; className?: string; sizes?: string; priority?: boolean }) {
  const p = products.find((x) => x.id === id);
  return (
    <Image
      src={`/assets/materials/renders/${id}.webp`}
      alt={`3D-illustrasjon av ${p?.name ?? id}`}
      width={800}
      height={600}
      sizes={sizes}
      quality={80}
      preload={priority}
      className={`h-auto w-full ${className}`}
    />
  );
}

/** Side-by-side scale of the sorted fractions, sand to coarse pukk. */
export function FractionScale({ ids = ["0-2", "2-8", "8-16", "16-32", "32-64", "64-90"] }: { ids?: RenderedId[] }) {
  return (
    <figure>
      <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6">
        {ids.map((id) => {
          const p = products.find((x) => x.id === id)!;
          return (
            <li key={id} className="text-center">
              <MaterialRender id={id} sizes="(min-width:640px) 16vw, 33vw" />
              <p className="mt-1 text-sm font-semibold tabular-nums text-forest-950">{p.min}–{p.max} mm</p>
              <p className="text-xs text-graphite/70">{p.cat}</p>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-5 text-xs text-graphite/70">
        3D-illustrasjon basert på skannede steiner, i samme skala for alle fraksjoner. Se produktbildene for faktisk utseende.
      </figcaption>
    </figure>
  );
}
