"use client";

import Image from "next/image";
import { useState } from "react";
import { productCats, products } from "@/content/site";

export default function ProductGrid() {
  const [cat, setCat] = useState<(typeof productCats)[number]>("Alle");
  const list = cat === "Alle" ? products : products.filter((p) => p.cat === cat);
  return (
    <div>
      <div role="group" aria-label="Filtrer produkter" className="flex flex-wrap gap-2">
        {productCats.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${cat === c ? "border-forest bg-forest text-paper" : "border-graphite/20 text-graphite hover:border-graphite/50"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Viser {list.length} produkter
      </p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <li key={p.id} className="group flex flex-col overflow-hidden rounded-[24px] border border-forest/10 bg-white">
            <div className="relative aspect-[3/2] overflow-hidden">
              <Image src={p.image} alt={p.name} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" quality={70} className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-cine)] group-hover:scale-105" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-forest-950 tabular-nums">
                {"spec" in p && p.spec ? p.spec : `${p.min}–${p.max} mm`}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="display text-xl text-forest-950">{p.name}</h3>
              <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-graphite/70">{p.text}</p>
              <div className="mt-5 flex items-end justify-between gap-3 border-t border-forest/10 pt-4">
                {p.price ? (
                  <p>
                    <span className="display text-2xl text-forest">Kr {p.price},-</span> <span className="text-sm text-graphite/70">per tonn</span>
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-forest">Kontakt oss for pris</p>
                )}
                <a href="#tilbud-title" className="text-sm font-semibold text-forest underline underline-offset-4">
                  Send henvendelse
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
