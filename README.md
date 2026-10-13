# Envir — "The Earth, Reimagined"

A cinematic 3D redesign of [envir.com](https://envir.com): Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Three.js via React Three Fiber · GSAP ScrollTrigger.

All copy is Norwegian and taken from the live site. Photos, logos and PDFs are Envir's own files.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
npm run lint
```

Copy `.env.example` to `.env.local` and configure contact-form delivery before launch (see [Contact form](#contact-form)).

## Homepage experience

| Section | What it does | Without 3D |
| --- | --- | --- |
| Hero | Floating earth cross-section (soil strata, roots, stone) with water and process streams; a facility grows out of the surface. Camera: extreme close-up → pull back → orbit → approach → settle with pointer parallax. | Official photo poster; headline never waits for WebGL |
| Fra jord til ressurs | Scroll-driven 5-step sequence: intake → sorting (>90 mm crushed) → washing (sludge → filter press → landfill, process water recirculated) → fractions → back into use. Stepper jumps to any step. | Five steps with real Envir photos |
| Alt under ett tak | Interactive *illustrative* facility model (6 zones). Hover, click or the keyboard list highlights a zone and moves the camera. "Statisk oversikt" toggle. | Schematic plan with the same zones |
| Hva vi tilbyr (A–D) | Four vignettes: truck tipping at intake, fraction carousel (real prices and specs), wash-drum cutaway, lab bench. | Official photos |
| Nøkkeltall | Published figures with count-up and small SVG visuals, labelled "not live readings". | Final values always in HTML |
| Bærekraft | Circular material-flow loop with selectable stages, and NORSUS LCA results with method and PDF. | Static |
| Om Envir · Nyheter · Kontakt | Parallax photo, quote, horizontal timeline, team. CMS news. Bright closing landscape with actions and the form. | — |

Every 3D surface is labelled "3D-illustrasjon", "Kunstnerisk visualisering" or "Illustrativ konseptmodell", and real photos are marked "Foto: Envir".

## Routes

`/` `/mottak` `/gjenvunne-masser` `/jordvaskeanlegg` `/jorddampeanlegg` `/laboratorium` `/kompetansesenter` `/isps-kai` `/baerekraft` `/om-oss` `/team` `/kontakt` `/nyheter` `/blogg/[slug]` (9 articles) `/faq` `/personvern` `/vilkar`, plus `sitemap.xml`, `robots.txt` and a custom 404. Unknown article slugs return a real 404 status via `src/proxy.ts`.

The old PDF URLs (`/__l5e/assets-v1/…/envir-prisliste-2026.pdf` etc.) redirect to `/docs/…`.

## Contact form

The forms on today's envir.com **don't submit anywhere**. They only show a "thank you" toast (verified in the site's JS bundle), so there was no backend to preserve. `POST /api/contact` validates on the server (shared schema in `src/lib/contact.ts`), uses a honeypot and a basic rate limit, and delivers via:

- **Resend:** `RESEND_API_KEY` + `CONTACT_TO_EMAIL` (+ `CONTACT_FROM_EMAIL` on a verified domain), or
- **Webhook:** `CONTACT_WEBHOOK_URL` (JSON POST to a CRM, Make, Zapier, Slack and similar).

With neither configured, the API returns `503 not_configured` and the user sees an honest message with a prefilled `mailto:` link. Three variants mirror the original forms: general, delivering material (`/mottak`), buying material (`/gjenvunne-masser`).

## 3D, performance and accessibility

- **Quality tiers** (`src/lib/quality.tsx`): `high` / `medium` / `low` / `static`, from WebGL support, CPU cores, memory, viewport and Save-Data. Low tier means fewer particles and instances, lower DPR and no environment-map pass. Visitors can switch 3D off (mobile menu and footer).
- **`SceneFrame`** mounts a canvas only near the viewport, pauses it offscreen, unmounts it far away, compiles shaders with `compileAsync` before the first frame, and falls back to its poster on error or context loss. The hero waits for `requestIdleCallback` after load.
- **Reduced motion:** no camera choreography or autorotation; the scroll sequence becomes a regular photo layout.
- **Textures:** the strata texture is procedural but baked to `public/textures/strata.webp`. Re-bake after editing `src/three/strata.ts`:
  `npx -y -p playwright-core@1.56.1 node scripts/bake-strata.mjs` (Node ≥ 23 and Chrome; set `CHROME_PATH` if needed).
- No glTF downloads: all geometry is procedural.
- Landmarks, skip link, visible focus, keyboard-operable explorers (`aria-pressed`, `aria-live`), alt text, text contrast ≥ 4.5:1.

**Lighthouse 12.8** (local production build):

| | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` desktop | 100 | 100 | 100 | 100 |
| `/` mobile (simulated) | 81–88 | 100 | 100 | 100 |
| `/mottak` mobile | 95 | 100 | 100 | 100 |
| `/gjenvunne-masser` mobile | 92–93 | 100 | 100 | 100 |

CLS is 0 on every page. The homepage's remaining mobile gap is hydration plus Three.js startup.

## Content provenance and open questions for Envir

Content is in `src/content/` (`site.ts`, `posts.json`, `legal.json`), scraped from envir.com on 13 Oct 2026. Team and news come from the site's public CMS.

**Please confirm before launch**, because the live site contradicts itself in these places:

1. **FAQ CO₂ claim:** the FAQ says "rundt 80 %" lower emissions and lists SDG 13. The NORSUS LCA (April 2026) gives 28 % / 74 % / 61 %, and the sustainability page lists goals 9, 11, 12 and 15. The FAQ is reproduced verbatim; everything else uses the LCA figures.
2. **Accepted classes:** the FAQ says "tilstandsklasse 1–5", but `/mottak` says "2 til 5". The `/mottak` wording is used outside the FAQ.
3. **Accreditation:** the FAQ and the old lab page `<title>` say "akkreditert", but the lab page body doesn't. The new site doesn't claim it outside the FAQ.
4. **Counters on `/gjenvunne-masser`:** "80 % lavere CO₂", "40 % lavere kostnad" and "50 % mindre transport" have no published source and are omitted. The CO₂ point shows −74 % citing the LCA instead.
5. **Privacy policy** mentions a cookie consent box. This build sets no analytics cookies, so update the text, or add a banner if analytics is introduced.
6. Fixed the typo "ooppstartsfase,morganisering" → "oppstartsfase, omorganisering" (Envir 3.0 milestone).

**Not included:** EN/DE versions (the live site has a language switcher; only Norwegian content was in scope), the "Last ned visittkort" vCards, and the CMS admin. Articles are static JSON; add to `posts.json` or wire up the CMS.
