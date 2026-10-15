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

Opens with real satellite data and a schematic soil cutaway, then Envir's own film, then the illustrative 3D process story and service vignettes.

| Section | What it does | Without WebGL / reduced motion |
| --- | --- | --- |
| Hero → Under overflaten | Pinned 380svh track. Intro (7 s): NASA Blue Marble globe → Western Norway (BMNG 500 m) → Bergen (Copernicus Sentinel-2 on Copernicus DEM, 1.45× relief). Scroll: descent to Laksevåg, dissolve into a schematic soil monolith (Poly Haven CC0 scans: turf, matjord with roots, sand, grus, mineralmasse, berggrunn) whose layers lift apart with labels; fully reversible. On phones the WebGL boot waits for the first scroll/touch (or 8 s) behind a poster that is the intro's first frame. | Rendered Bergen aerial still + an HTML strata figure built from the same scans; no pinning |
| Fra jord til ressurs | Envir's official background film (Vimeo, lazy, muted) behind the heading, then a scroll-driven 3D sequence through five stations: intake → sorting (>90 mm crushed) → washing (sludge → filter press, process water recirculated) → fractions → back into use. Stations are linked by conveyor runs so the camera never crosses empty floor, and the crane move eases into every stop. Stepper jumps to any step. | Film poster + five steps with real Envir photos |
| Alt under ett tak | Interactive *illustrative* facility model (6 zones). Hover, click or the keyboard list highlights a zone and moves the camera. "Statisk oversikt" toggle. | Schematic plan with the same zones |
| Hva vi tilbyr (A–D) | Four 3D vignettes: truck tipping at intake, fraction carousel, wash-drum cutaway, lab bench. In the carousel the selected fraction lifts and stays in focus while the rest of the ring falls out of focus (depth of field), and the ring turns with the mouse. Real prices and specs. | Official photos |
| Nøkkeltall · Bærekraft · Om Envir · Nyheter · Kontakt | Published figures, circular flow + NORSUS LCA, parallax photo, CMS news, closing landscape with actions and the form. | — |

Labels are honest: satellite imagery carries its NASA/Copernicus credit as it appears, the cutaway is labelled "Skjematisk jordprofil – ikke i målestokk", the film is marked "Film: Envir", and every illustrative 3D scene is labelled "3D-illustrasjon", "Kunstnerisk visualisering" or "Illustrativ konseptmodell". Full attribution is in the footer and [ASSETS.md](ASSETS.md).

## Routes

`/` `/mottak` `/gjenvunne-masser` `/jordvaskeanlegg` `/jorddampeanlegg` `/laboratorium` `/kompetansesenter` `/isps-kai` `/baerekraft` `/om-oss` `/team` `/kontakt` `/nyheter` `/blogg/[slug]` (9 articles) `/faq` `/personvern` `/vilkar`, plus `sitemap.xml`, `robots.txt` and a custom 404. Unknown article slugs return a real 404 status via `src/proxy.ts`.

The old PDF URLs (`/__l5e/assets-v1/…/envir-prisliste-2026.pdf` etc.) redirect to `/docs/…`.

## Contact form

The forms on today's envir.com **don't submit anywhere**. They only show a "thank you" toast (verified in the site's JS bundle), so there was no backend to preserve. `POST /api/contact` validates on the server (shared schema in `src/lib/contact.ts`), uses a honeypot and a basic rate limit, and delivers via:

- **Resend:** `RESEND_API_KEY` + `CONTACT_TO_EMAIL` (+ `CONTACT_FROM_EMAIL` on a verified domain), or
- **Webhook:** `CONTACT_WEBHOOK_URL` (JSON POST to a CRM, Make, Zapier, Slack and similar).

The honeypot (`website`) is a `hidden` input with no label, so it's invisible, out of the tab order and absent from the accessibility tree. The rate limit is per server instance, which is only a light deterrent on serverless hosting.

With neither configured, the API returns `503 not_configured` and the user sees an honest message with a prefilled `mailto:` link. Three variants mirror the original forms: general, delivering material (`/mottak`), buying material (`/gjenvunne-masser`).

## 3D, performance and accessibility

- **Quality tiers** (`src/lib/quality.tsx`): `high` / `medium` / `low` / `static`, from WebGL support, CPU cores, memory, viewport and Save-Data. Tiers pick texture sizes (4k/2k globe, 2k/1k Sentinel-2, 1k/512 scans, no normal maps on phones), terrain resolution and shadows. Visitors can switch 3D off (mobile menu and footer).
- **`SceneFrame`** mounts a canvas only near the viewport, pauses it offscreen, unmounts it far away, compiles shaders with `compileAsync` before the first frame, and falls back to its poster on error or context loss. The hero waits for `requestIdleCallback` after load.
- **Reduced motion:** no camera choreography or autorotation; the scroll sequence becomes a regular photo layout.
- **Assets:** NASA Blue Marble, Copernicus Sentinel-2 and Copernicus DEM (`scripts/fetch-geodata.mjs`, georeferencing in `public/assets/geo/geo.json`), CC0 Poly Haven geology scans (`scripts/fetch-geology.mjs`), the film poster in `public/assets/envir-hd/`. Textures decode off the main thread (ImageBitmap) and load in stages. Every file, its source, licence and optimisation is listed in [ASSETS.md](ASSETS.md); regenerate with `node scripts/asset-manifest.mjs`.
- **Scroll measurement:** `ScrollRefresh` re-measures all ScrollTriggers when the document height changes (pinned sections above would otherwise shift every trigger below them).
- **Labels in 3D** use `src/three/ScreenLabel.tsx` (plain DOM), not drei `<Html>`, which crashes on canvas teardown with React 19.
- Landmarks, skip link, visible focus, keyboard-operable explorers (`aria-pressed`, `aria-live`), alt text, text contrast ≥ 4.5:1.

**Lighthouse** (local production build, homepage, after the photoreal upgrade):

| | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` desktop | 95 | 100 | 100 | 100 |
| `/` mobile (simulated 4G, 4× CPU) | 91–93 | 100 | 100 | 100 |

CLS is 0; mobile TBT 180–280 ms, LCP ≈ 2.7 s; desktop LCP 0.7 s. Scrolling the hero and process story holds 60 fps (p95 frame 16.8 ms) on desktop and on a 4×-throttled phone emulation.

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
