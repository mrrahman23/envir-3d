"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { company } from "@/content/site";
import { FORMS, summarize, validate, type Variant } from "@/lib/contact";

function selectProps<T extends { placeholder?: string; maxLength?: number; autoComplete?: string }>(p: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { placeholder, maxLength, ...rest } = p;
  return rest;
}

type Status = "idle" | "sending" | "success" | "error" | "not_configured" | "rate_limited";

export default function ContactForm({
  variant = "general",
  defaultService,
  defaultValues = {},
  tone = "light",
  submitLabel,
}: {
  variant?: Variant;
  defaultService?: string;
  defaultValues?: Record<string, string>;
  tone?: "light" | "dark";
  submitLabel?: string;
}) {
  const uid = useId();
  const form = FORMS[variant];
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [lastValues, setLastValues] = useState<Record<string, string>>({});
  const dark = tone === "dark";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const fd = new FormData(e.currentTarget);
    const values = Object.fromEntries(form.fields.map((f) => [f.name, String(fd.get(f.name) ?? "")]));
    const result = validate(variant, values);
    setErrors(result.errors);
    setLastValues(result.clean);
    if (!result.ok) {
      const first = form.fields.find((f) => result.errors[f.name]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first.name}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, fields: result.clean, website: String(fd.get("website") ?? ""), page: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        formRef.current?.reset();
        return;
      }
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        setStatus("idle");
        return;
      }
      setStatus(data.error === "not_configured" ? "not_configured" : res.status === 429 ? "rate_limited" : "error");
    } catch {
      setStatus("error");
    }
  };

  const mailto = `mailto:${company.email}?subject=${encodeURIComponent(`Henvendelse – ${form.title}`)}&body=${encodeURIComponent(summarize(variant, lastValues))}`;

  if (status === "success") {
    return (
      <div role="status" className={`rounded-[24px] p-8 ${dark ? "bg-white/5 text-white" : "bg-white text-graphite"}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-forest-950">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="m5 12 5 5L20 7" />
          </svg>
        </div>
        <h3 className="display mt-5 text-2xl">Takk for din henvendelse!</h3>
        <p className={`mt-2 ${dark ? "text-white/70" : "text-graphite/70"}`}>Vi tar kontakt innen én virkedag.</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-6 text-sm font-semibold underline underline-offset-4">
          Send en ny henvendelse
        </button>
      </div>
    );
  }

  const labelCls = `mb-1.5 block text-sm font-medium ${dark ? "text-white/85" : "text-graphite"}`;
  const fieldCls = `field ${dark ? "!border-white/15 !bg-white/[0.06] !text-white placeholder:!text-white/55" : ""}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative grid gap-4 sm:grid-cols-2" aria-describedby={`${uid}-req`}>
      <p id={`${uid}-req`} className={`text-xs sm:col-span-2 ${dark ? "text-white/50" : "text-graphite/70"}`}>
        Felt merket med * må fylles ut.
      </p>
      {form.fields.map((f) => {
        const id = `${uid}-${f.name}`;
        const err = errors[f.name];
        const full = form.fields.length <= 4 || f.type === "textarea" || f.type === "select";
        const common = {
          id,
          name: f.name,
          required: f.required,
          "aria-required": f.required || undefined,
          "aria-invalid": err ? true : undefined,
          "aria-describedby": err ? `${id}-err` : undefined,
          placeholder: f.placeholder,
          autoComplete: f.autoComplete,
          maxLength: f.max,
          defaultValue: f.name === "service" ? defaultService ?? "" : defaultValues[f.name],
          onChange: () => err && setErrors((e2) => ({ ...e2, [f.name]: "" })),
          className: fieldCls,
        };
        return (
          <div key={f.name} className={full ? "sm:col-span-2" : ""}>
            <label htmlFor={id} className={labelCls}>
              {f.label}
              {f.required && <span aria-hidden> *</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea {...common} rows={5} />
            ) : f.type === "select" ? (
              <select {...selectProps(common)}>
                <option value="">Velg en kategori</option>
                {f.options!.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input {...common} type={f.type} inputMode={f.type === "tel" ? "tel" : undefined} />
            )}
            {err && (
              <p id={`${id}-err`} className={`mt-1.5 text-sm ${dark ? "text-[#ffb4a9]" : "text-[#b3261e]"}`}>
                {err}
              </p>
            )}
          </div>
        );
      })}

      {/*
        Honeypot. Removed from layout, the accessibility tree and the tab order:
        `hidden` + display:none keeps it invisible even without CSS, and it carries no
        visible label text. Bots that fill every input still populate it.
      */}
      <input type="text" name="website" defaultValue="" tabIndex={-1} autoComplete="off" aria-hidden hidden style={{ display: "none" }} />

      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${dark ? "text-white/50" : "text-graphite/70"}`}>
          Vi behandler opplysningene i tråd med vår{" "}
          <Link href="/personvern" className="underline underline-offset-2">
            personvernerklæring
          </Link>
          .
        </p>
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-7 py-3.5 font-semibold text-forest-950 transition-colors hover:bg-[#c7e46c] disabled:cursor-wait disabled:opacity-70"
        >
          {status === "sending" ? (
            <>
              <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-forest-950/30 border-t-forest-950" />
              Sender …
            </>
          ) : (
            submitLabel ?? "Send henvendelse"
          )}
        </button>
      </div>

      <div aria-live="assertive" className="sm:col-span-2">
        {(status === "error" || status === "not_configured" || status === "rate_limited") && (
          <div role="alert" className={`rounded-2xl border p-4 text-sm ${dark ? "border-[#ffb4a9]/40 bg-[#ffb4a9]/10 text-white" : "border-[#b3261e]/30 bg-[#b3261e]/5 text-graphite"}`}>
            <p className="font-semibold">
              {status === "not_configured"
                ? "Skjemaet er ikke koblet til e-post ennå."
                : status === "rate_limited"
                  ? "Du har sendt mange henvendelser på kort tid."
                  : "Noe gikk galt, og henvendelsen ble ikke sendt."}
            </p>
            <p className="mt-1">
              Send oss gjerne en e-post på{" "}
              <a href={mailto} className="font-semibold underline underline-offset-2">
                {company.email}
              </a>{" "}
              (innholdet fra skjemaet fylles inn automatisk) eller ring{" "}
              <a href={company.phoneHref} className="font-semibold underline underline-offset-2">
                {company.phone}
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
