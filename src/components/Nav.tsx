"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { company, nav } from "@/content/site";
import { useQuality } from "@/lib/quality";
import { Logo } from "./ui";

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { enabled3D, set3D, capable } = useQuality();

  // Close the menu on route change (state derived during render, no effect needed).
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The mobile menu covers the whole viewport: pause every 3D render loop underneath.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("envir:overlay", { detail: { open } }));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = menuRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && menuRef.current) {
        const f = menuRef.current.querySelectorAll<HTMLElement>("a,button");
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        solid ? "border-b border-white/10 bg-forest-950/80 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav aria-label="Hovedmeny" className="mx-auto flex h-[var(--nav-h)] max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="relative z-10 shrink-0" aria-label="Envir – til forsiden">
          <Logo variant="white" eager className="w-[104px] sm:w-[118px]" />
        </Link>

        <ul className="hidden items-center gap-1 xl:flex">
          {nav.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${
                    active ? "text-lime" : "text-white/80 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="relative z-10 flex items-center gap-2">
          <a
            href={company.phoneHref}
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white lg:inline-flex"
          >
            {company.phone}
          </a>
          <Link
            href="/kontakt"
            className="hidden rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-forest-950 transition-colors hover:bg-[#c7e46c] sm:inline-flex"
          >
            Kontakt oss
          </Link>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobilmeny"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 xl:hidden"
          >
            <span className="sr-only">{open ? "Lukk meny" : "Åpne meny"}</span>
            <span aria-hidden className="relative block h-3 w-5">
              <span className={`absolute left-0 top-0 h-[1.5px] w-5 bg-current transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-[1.5px] w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobilmeny"
        ref={menuRef}
        hidden={!open}
        className="h-[calc(100dvh-var(--nav-h))] overflow-y-auto bg-forest-950 px-4 pb-10 pt-6 sm:px-6 xl:hidden"
      >
        <ul className="flex flex-col">
          {[...nav, { label: "ISPS-kai", href: "/isps-kai" }, { label: "Vårt team", href: "/team" }, { label: "FAQ", href: "/faq" }, { label: "Kontakt", href: "/kontakt" }].map(
            (l) => (
              <li key={l.href} className="border-b border-white/10">
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="display flex items-center justify-between py-4 text-[1.75rem] text-white aria-[current=page]:text-lime"
                >
                  {l.label}
                </Link>
              </li>
            ),
          )}
        </ul>
        <div className="mt-8 grid gap-3 text-white/80">
          <a href={company.phoneHref} className="text-lg">
            {company.phone}
          </a>
          <a href={`mailto:${company.email}`} className="text-lg">
            {company.email}
          </a>
          {capable && (
            <button
              type="button"
              onClick={() => set3D(!enabled3D)}
              aria-pressed={enabled3D}
              className="mt-4 inline-flex w-fit items-center gap-3 rounded-full border border-white/20 px-4 py-2 text-sm"
            >
              <span aria-hidden className={`h-2 w-2 rounded-full ${enabled3D ? "bg-lime" : "bg-white/40"}`} />
              3D-visualiseringer: {enabled3D ? "på" : "av"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
