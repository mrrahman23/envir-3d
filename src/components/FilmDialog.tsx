"use client";

import { useEffect, useRef } from "react";

/** Native <dialog> modal for the official Vimeo presentation film. */
export default function FilmDialog({ open, onClose, src, title }: { open: boolean; onClose: () => void; src: string; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-auto w-[min(1100px,calc(100vw-32px))] overflow-visible bg-transparent p-0 backdrop:bg-night/90 backdrop:backdrop-blur-sm"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
        {open && <iframe src={src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />}
      </div>
      <button type="button" onClick={onClose} className="absolute -top-12 right-0 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
        Lukk film
      </button>
    </dialog>
  );
}
