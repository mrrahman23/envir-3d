import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grain relative flex min-h-[80svh] items-center bg-night text-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-[var(--nav-h)] sm:px-6 lg:px-10">
        <p className="eyebrow text-lime">404</p>
        <h1 className="display mt-6 text-[clamp(2.6rem,6vw,5.4rem)]">Denne siden finnes ikke.</h1>
        <p className="mt-5 max-w-xl text-lg text-white/70">Siden kan ha blitt flyttet. Gå til forsiden, eller ta kontakt med oss.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-lime px-6 py-3.5 font-semibold text-forest-950">
            Til forsiden
          </Link>
          <Link href="/kontakt" className="rounded-full border border-white/30 px-6 py-3.5 font-semibold">
            Kontakt oss
          </Link>
        </div>
      </div>
    </section>
  );
}
