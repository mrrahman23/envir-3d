import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import Magnetic from "./Magnetic";

export function Logo({ variant = "color", className = "", eager }: { variant?: "color" | "white"; className?: string; eager?: boolean }) {
  return (
    <Image
      src={variant === "white" ? "/assets/envir/envir-logo-white.svg" : "/assets/envir/envir-logo.svg"}
      alt="Envir"
      width={642}
      height={242}
      className={`h-auto ${className}`}
      unoptimized
      loading={eager ? "eager" : "lazy"}
    />
  );
}

type Tone = "lime" | "forest" | "ghost-light" | "ghost-dark" | "white";

const toneClass: Record<Tone, string> = {
  lime: "bg-lime text-forest-950 hover:bg-[#c7e46c]",
  forest: "bg-forest text-paper hover:bg-forest-700",
  white: "bg-white text-forest-950 hover:bg-paper",
  "ghost-light": "border border-white/30 text-white hover:bg-white/10 hover:border-white/60",
  "ghost-dark": "border border-graphite/20 text-graphite hover:bg-graphite/5 hover:border-graphite/40",
};

export function ButtonLink({
  href,
  children,
  tone = "lime",
  className = "",
  external,
  arrow = true,
  ...rest
}: {
  href: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
  external?: boolean;
  arrow?: boolean;
} & Omit<ComponentProps<"a">, "href">) {
  const cls = `group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-[0.95rem] font-semibold tracking-[-0.01em] transition-[background-color,border-color,color] duration-300 ${toneClass[tone]} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <ArrowIcon className="h-4 w-4 transition-transform duration-500 ease-[var(--ease-cine)] group-hover:translate-x-1" />}
    </>
  );
  const isExternal = external ?? /^(https?:|mailto:|tel:|\/docs\/)/.test(href);
  return (
    <Magnetic>
      {isExternal ? (
        <a href={href} className={cls} {...rest} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {inner}
        </a>
      ) : (
        <Link href={href} className={cls} {...rest}>
          {inner}
        </Link>
      )}
    </Magnetic>
  );
}

export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 font-semibold underline decoration-current/25 underline-offset-[6px] transition-colors hover:decoration-current ${className}`}
    >
      {children}
      <ArrowIcon className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
    </Link>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      <span aria-hidden className="inline-block h-px w-8 bg-current opacity-60" />
      {children}
    </p>
  );
}

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRight({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function Icon({ name, className = "h-5 w-5" }: { name: "phone" | "mail" | "pin" | "clock" | "download" | "play"; className?: string }) {
  const paths: Record<string, ReactNode> = {
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
    play: <path d="m6 3 14 9-14 9V3Z" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}

export function SocialIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  if (name === "Facebook")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M14 8V6.2c0-.8.2-1.2 1.4-1.2H17V2h-2.6C11.3 2 10.5 3.6 10.5 6v2H8v3h2.5v11H14V11h2.6l.4-3H14Z" />
      </svg>
    );
  if (name === "Instagram")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9.5Z" />
    </svg>
  );
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo" }).format(new Date(iso + "T12:00:00Z"));
}
