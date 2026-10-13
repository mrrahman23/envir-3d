import { FORMS, summarize, validate, type Variant } from "@/lib/contact";

/**
 * Contact endpoint.
 *
 * The current envir.com forms do not submit anywhere (they only show a toast),
 * so there is no existing backend to preserve. Delivery is configured with env vars:
 *   RESEND_API_KEY + CONTACT_TO_EMAIL [+ CONTACT_FROM_EMAIL]  → e-mail via Resend
 *   CONTACT_WEBHOOK_URL                                        → JSON POST (CRM, Slack, Make, …)
 * With neither set the endpoint answers 503 "not_configured" and the UI offers e-mail instead.
 */

const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const variant = body.variant as Variant;
  if (!variant || !(variant in FORMS)) return json({ error: "bad_request" }, 400);

  // Honeypot: bots fill hidden fields. Pretend success, deliver nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") return json({ ok: true });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return json({ error: "rate_limited" }, 429);

  const values = (body.fields ?? {}) as Record<string, unknown>;
  const { ok, errors, clean } = validate(variant, values);
  if (!ok) return json({ error: "validation", errors }, 422);

  const subject = `Ny henvendelse fra envir.com – ${FORMS[variant].title}`;
  const text = `${subject}\n\n${summarize(variant, clean)}\n\nSide: ${typeof body.page === "string" ? body.page.slice(0, 200) : "-"}`;
  const replyTo = clean.email || (/@/.test(clean.kontakt ?? "") ? clean.kontakt : undefined);

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, CONTACT_WEBHOOK_URL } = process.env;

  try {
    if (RESEND_API_KEY && CONTACT_TO_EMAIL) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: CONTACT_FROM_EMAIL || "Envir nettside <onboarding@resend.dev>",
          to: CONTACT_TO_EMAIL.split(",").map((s) => s.trim()),
          subject,
          text,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });
      if (!res.ok) throw new Error(`resend ${res.status}`);
      return json({ ok: true });
    }
    if (CONTACT_WEBHOOK_URL) {
      const res = await fetch(CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, subject, fields: clean, text, receivedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
      return json({ ok: true });
    }
  } catch (err) {
    console.error("[contact] delivery failed", err);
    return json({ error: "delivery_failed" }, 502);
  }

  return json({ error: "not_configured" }, 503);
}
