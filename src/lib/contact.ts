/** Shared contact-form schema — used by the client form and the API route. */

export type Variant = "general" | "mottak" | "salg";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  options?: string[];
  max: number;
  /** "contact" = must be a valid phone number or e-mail address */
  rule?: "email" | "phone" | "contact";
};

export const SERVICE_OPTIONS = [
  "Massemottak",
  "Kjøp av gjenvunne masser",
  "Forespørsel om tilbud",
  "Jordbehandling & analyse",
  "Laboratorietjenester",
  "Samarbeid / partnerskap",
  "Annet",
];

export const FORMS: Record<Variant, { title: string; fields: FieldDef[] }> = {
  general: {
    title: "Generell henvendelse",
    fields: [
      { name: "name", label: "Navn", type: "text", required: true, placeholder: "Ditt navn", autoComplete: "name", max: 120 },
      { name: "company", label: "Selskap", type: "text", placeholder: "Firmanavn", autoComplete: "organization", max: 160 },
      { name: "email", label: "E-post", type: "email", required: true, placeholder: "din@epost.no", autoComplete: "email", max: 200, rule: "email" },
      { name: "phone", label: "Telefon", type: "tel", placeholder: "+47 000 00 000", autoComplete: "tel", max: 40, rule: "phone" },
      { name: "service", label: "Hva gjelder henvendelsen?", type: "select", options: SERVICE_OPTIONS, max: 80 },
      { name: "message", label: "Melding", type: "textarea", required: true, placeholder: "Beskriv din henvendelse …", max: 4000 },
    ],
  },
  mottak: {
    title: "Levering av masser",
    fields: [
      { name: "firma", label: "Firma", type: "text", required: true, placeholder: "Firmanavn", autoComplete: "organization", max: 160 },
      { name: "masser", label: "Type masser", type: "text", required: true, placeholder: "F.eks. forurenset jord kl. 3", max: 300 },
      { name: "leveringsdag", label: "Leveringsdag", type: "text", placeholder: "Uke 12 eller snarest", max: 120 },
      { name: "kontakt", label: "Mobil / e-post", type: "text", required: true, placeholder: "Telefon eller e-post", max: 200, rule: "contact" },
    ],
  },
  salg: {
    title: "Kjøp av gjenvunne masser",
    fields: [
      { name: "firma", label: "Firma", type: "text", required: true, placeholder: "Firmanavn", autoComplete: "organization", max: 160 },
      { name: "innhold", label: "Ønsket produkt", type: "text", required: true, placeholder: "F.eks. Pukk 16–32 mm", max: 300 },
      { name: "leveringsdag", label: "Ønsket leveringsdag", type: "text", placeholder: "Uke 12 eller snarest", max: 120 },
      { name: "kontakt", label: "Mobil / e-post", type: "text", required: true, placeholder: "Telefon eller e-post", max: 200, rule: "contact" },
    ],
  },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()-]{8,20}$/;

export function validate(variant: Variant, values: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const clean: Record<string, string> = {};
  for (const f of FORMS[variant].fields) {
    const raw = values[f.name];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (f.required && !v) {
      errors[f.name] = `${f.label} må fylles ut.`;
      continue;
    }
    if (v.length > f.max) {
      errors[f.name] = `${f.label} kan ha maks ${f.max} tegn.`;
      continue;
    }
    if (v && f.rule === "email" && !EMAIL.test(v)) errors[f.name] = "Skriv inn en gyldig e-postadresse.";
    if (v && f.rule === "phone" && !PHONE.test(v)) errors[f.name] = "Skriv inn et gyldig telefonnummer.";
    if (v && f.rule === "contact" && !EMAIL.test(v) && !PHONE.test(v)) errors[f.name] = "Skriv inn et gyldig telefonnummer eller en e-postadresse.";
    if (v && f.type === "select" && f.options && !f.options.includes(v)) errors[f.name] = "Velg et alternativ fra listen.";
    clean[f.name] = v;
  }
  return { ok: Object.keys(errors).length === 0, errors, clean };
}

export function summarize(variant: Variant, clean: Record<string, string>) {
  return FORMS[variant].fields
    .filter((f) => clean[f.name])
    .map((f) => `${f.label}: ${clean[f.name]}`)
    .join("\n");
}
