/**
 * Verified content sourced from https://envir.com (scraped 13 Oct 2026).
 * Every figure, quote, name and price below appears on the live site.
 * Do not add claims here that are not published by Envir.
 */

export const company = {
  name: "Envir AS",
  orgnr: "918 320 706",
  tagline: "Et av verdens mest komplette anlegg for gjenvinning av forurenset jord og gravemasser.",
  phone: "+47 55 200 400",
  phoneHref: "tel:+4755200400",
  email: "post@envir.com",
  address: "Sjøkrigsskoleveien 15",
  postal: "5165 Laksevåg",
  city: "Bergen",
  hours: [
    { d: "Man–fre", t: "07:00–16:00" },
    { d: "Lør–søn", t: "Stengt" },
  ],
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sj%C3%B8krigsskoleveien+15%2C+5165+Laksev%C3%A5g",
  social: [
    { label: "Facebook", handle: "@envir.as", href: "https://www.facebook.com/envir.as/" },
    { label: "Instagram", handle: "@envir_as", href: "https://www.instagram.com/envir_as/" },
    { label: "LinkedIn", handle: "Envir AS", href: "https://www.linkedin.com/company/envir/" },
  ],
  docs: {
    prisliste: "/docs/envir-prisliste-2026.pdf",
    brosjyre: "/docs/envir-brosjyre.pdf",
    lca: "/docs/envir-lca-rapport.pdf",
  },
  film: "https://player.vimeo.com/video/1054466245?autoplay=1",
  backgroundFilm:
    "https://player.vimeo.com/video/1205434986?background=1&autoplay=1&loop=1&muted=1&autopause=0&dnt=1",
};

export const nav = [
  { label: "Massemottak", href: "/mottak" },
  { label: "Gjenvunne masser", href: "/gjenvunne-masser" },
  { label: "Jordbehandling", href: "/jordvaskeanlegg" },
  { label: "Laboratorium", href: "/laboratorium" },
  { label: "Bærekraft", href: "/baerekraft" },
  { label: "Om oss", href: "/om-oss" },
  { label: "Nyheter", href: "/nyheter" },
];

export const footerNav = {
  Tjenester: [
    { label: "Massemottak", href: "/mottak" },
    { label: "Salg av masser", href: "/gjenvunne-masser" },
    { label: "Jordbehandling", href: "/jordvaskeanlegg" },
    { label: "Jorddampeanlegg", href: "/jorddampeanlegg" },
    { label: "Laboratorium", href: "/laboratorium" },
    { label: "ISPS-kai", href: "/isps-kai" },
  ],
  Selskap: [
    { label: "Om Envir", href: "/om-oss" },
    { label: "Vårt team", href: "/team" },
    { label: "Kompetansesenter", href: "/kompetansesenter" },
    { label: "Bærekraft", href: "/baerekraft" },
    { label: "Nyheter", href: "/nyheter" },
    { label: "Karriere", href: "/kontakt" },
  ],
};

export const hero = {
  title: "Vi gjør bygg- og anleggsbransjen grønnere.",
  lead: "Vi gir jord og gravemasser nytt liv gjennom avansert gjenvinning, dokumentert kvalitet og sirkulære løsninger.",
  sourceLead: company.tagline,
  caption: "Fra ressurs til ressurs.",
};

/** Published key figures (homepage, envir.com). */
export const metrics = [
  {
    id: "recovery",
    value: 80,
    prefix: "",
    suffix: "%",
    label: "gjenvinningsgrad",
    text: "På vårt jordvaskeanlegg gjenvinner vi 80% av massene, inkludert rensing av fin sand.",
  },
  {
    id: "capacity",
    value: 150000,
    prefix: "",
    suffix: " tonn",
    label: "mottakskapasitet per år",
    text: "Anlegget vårt på Laksevåg har kapasitet til å ta imot mer enn 150 000 tonn masser i året.",
  },
  {
    id: "fractions",
    value: null,
    display: "0,01–90 mm",
    label: "fraksjoner",
    text: "Vi tilbyr ulike fraksjoner av gjenvunne masser tilpasset dine behov.",
  },
  {
    id: "quay",
    value: 5000,
    prefix: "",
    suffix: " tonn",
    label: "ISPS-kai",
    text: "Vi har en egen ISPS-kai som tar imot båter opptil 5000 tonn, noe som gjør det mulig å transportere masser sjøveien og redusere lastebiltrafikken betydelig.",
  },
  {
    id: "distance",
    value: 10,
    prefix: "<",
    suffix: " min",
    label: "fra Bergen sentrum",
    text: "Du finner et av verdens mest komplette anlegg for gjenvinning av forurenset jord og gravemasser under 10 minutter fra Bergen sentrum.",
  },
] as const;

/** Washing process — /jordvaskeanlegg "Slik fungerer det". */
export const washSteps = [
  {
    n: "01",
    title: "Innveiing og inspeksjon",
    text: "Lastebilene veies inn og tipper massene i skitten sone, hvor de sjekkes og vurderes av våre operatører.",
  },
  {
    n: "02",
    title: "Sortering",
    text: "En gravemaskin mater massene inn i anlegget, hvor steiner større enn 90 mm sorteres ut, knuses ned og mates tilbake til anlegget igjen.",
  },
  {
    n: "03",
    title: "Vask og rensing",
    text: "Massene vaskes mekanisk og med vann, uten tilsetning av kjemikalier. Plast og organisk materiale (kvister, barnåler o.l) flyter opp og tas vekk. Slammet der forurensningene er tilsettes flokkuleringskjemikalie, og samles opp i slambassenget før vi presser ut vannet i en filterpresse. Filterkakene med forurensing går til deponi, mens det rensete prosessvannet går tilbake i vaskeanlegget.",
  },
  {
    n: "04",
    title: "Finsortering",
    text: "Gjennom flere vaske- og sorteringstrinn får vi også renset den fineste sanden, og rene masser sorteres etter ønsket størrelse. De får ligge i et døgn og renne av seg, før de rene og tørre massene selges ut.",
  },
];

/** Scroll-to-transform storyline — built strictly on washSteps + published product uses. */
export const transformStages = [
  {
    key: "arrival",
    kicker: "01 — Ankomst",
    title: "Massene kommer inn",
    text: "Lastebilene veies inn og tipper massene i skitten sone, hvor de sjekkes og vurderes av våre operatører. Før levering må forurensningsnivået være dokumentert gjennom vår mottakskontroll.",
  },
  {
    key: "separation",
    kicker: "02 — Sortering",
    title: "Stein skilles ut",
    text: "En gravemaskin mater massene inn i anlegget. Steiner større enn 90 mm sorteres ut, knuses ned og mates tilbake til anlegget igjen.",
  },
  {
    key: "purification",
    kicker: "03 — Vask og rensing",
    title: "Vann, ikke kjemikalier",
    text: "Massene vaskes mekanisk og med vann, uten tilsetning av kjemikalier. Forurensningene bindes i slammet, som presses i en filterpresse. Filterkakene med forurensning går til deponi – det rensete prosessvannet går tilbake i anlegget.",
  },
  {
    key: "recovery",
    kicker: "04 — Finsortering",
    title: "Rene fraksjoner",
    text: "Gjennom flere vaske- og sorteringstrinn renses også den fineste sanden. Rene masser sorteres etter størrelse – fra kabelsand til grov pukk – og analyseres i vårt laboratorium.",
  },
  {
    key: "newlife",
    kicker: "05 — Nytt liv",
    title: "Tilbake i bruk",
    text: "Opp til 80 % av massene gjenvinnes til nye produkter: CE-merket pukk, singel, grus og sand til drenering, veibygging, kabelgrøfter og betong.",
  },
];

/** Interactive facility hotspots — descriptions from the corresponding envir.com pages. */
export const facilityZones = [
  {
    id: "mottak",
    label: "Massemottak",
    short: "Innveiing og mottakskontroll",
    text: "Vi tar imot forurensede masser i tilstandsklasse 2 til 5 og jord med uønskede fremmedarter som parkslirekne. Vi kan ikke ta imot masser klassifisert som farlig avfall.",
    href: "/mottak",
    cta: "Les mer om massemottak",
  },
  {
    id: "vask",
    label: "Jordvaskeanlegg",
    short: "80 % gjenvinningsgrad",
    text: "Massene vaskes mekanisk og med vann, uten tilsetning av kjemikalier. Gjennom flere vaske- og sorteringstrinn renses også den fineste sanden.",
    href: "/jordvaskeanlegg",
    cta: "Utforsk jordbehandling",
  },
  {
    id: "damp",
    label: "Jorddampeanlegg",
    short: "Over 94 °C dampbehandling",
    text: "Jorden varmes opp til 94 °C i minst 20 minutter med vanlig vanndamp. Det dreper ugras, sopp og mikroorganismer – uten kjemikalier.",
    href: "/jorddampeanlegg",
    cta: "Les om jorddamping",
  },
  {
    id: "lager",
    label: "Gjenvunne masser",
    short: "Pukk, singel, grus og sand",
    text: "CE-merkede gjenvunne masser fra vårt anlegg på Laksevåg. Alle produkter er vasket, sortert og kvalitetssikret gjennom vårt laboratorium.",
    href: "/gjenvunne-masser",
    cta: "Utforsk våre masser",
  },
  {
    id: "lab",
    label: "Laboratorium",
    short: "Kjemisk og geoteknisk analyse",
    text: "Laboratoriet ligger i den gamle hydraulikkhallen og er delt i to: analyse av kjemisk forurensning og geotekniske egenskaper for de gjenvunne massene.",
    href: "/laboratorium",
    cta: "Les om laboratoriet",
  },
  {
    id: "kai",
    label: "ISPS-kai",
    short: "Båter opptil 5000 tonn",
    text: "Egen ISPS-godkjent kai gjør det mulig å ta imot og skipe ut masser sjøveien – og spare veinettet for hundrevis av lastebiler.",
    href: "/isps-kai",
    cta: "Les om ISPS-kaien",
  },
] as const;

export type FacilityZoneId = (typeof facilityZones)[number]["id"];

export const services = [
  {
    id: "mottak",
    index: "A",
    kicker: "Massemottak",
    title: "Lever forurensede masser – ta med et rent lass tilbake.",
    text: "Levering av forurensede masser og gravemasser for behandling og gjenvinning. Før levering dokumenterer vi gjennom mottakskontroll at massene er egnet for gjenvinning. Våre miljørådgivere bistår med prøvetaking og analyser der det mangler.",
    bullets: [
      "Tilstandsklasse 2 til 5",
      "Jord med uønskede fremmedarter",
      "Ingen grenseverdi på organisk innhold (TOC)",
    ],
    note: "Vi kan ikke ta imot masser klassifisert som farlig avfall.",
    href: "/mottak",
    cta: "Les mer om massemottak",
    image: "/assets/envir/service-massemottak.webp",
  },
  {
    id: "salg",
    index: "B",
    kicker: "Salg av gjenvunne masser",
    title: "CE-merkede masser, vasket og kvalitetssikret.",
    text: "Høykvalitets pukk, singel, sand og grus fra vårt gjenvinningsanlegg. Alle produkter er vasket, sortert og kvalitetssikret gjennom vårt laboratorium.",
    bullets: [],
    href: "/gjenvunne-masser",
    cta: "Utforsk våre masser",
    image: "/assets/envir/service-salg.webp",
  },
  {
    id: "behandling",
    index: "C",
    kicker: "Jordbehandling",
    title: "To prosesser. Vask og damp.",
    text: "I jordvaskeanlegget vaskes og sorteres forurensede masser industrielt, med vann og uten kjemikalier. I jorddampeanlegget behandles jord med fremmede arter ved 94 °C.",
    bullets: ["Vaskeprosessen – industriell vask og sortering", "Jorddampeprosessen – damping ved 94 °C"],
    href: "/jordvaskeanlegg",
    cta: "Utforsk jordbehandling",
    image: "/assets/envir/jordvaskeanlegg.jpg",
  },
  {
    id: "lab",
    index: "D",
    kicker: "Laboratorium",
    title: "Analyse, dokumentasjon og testsertifikater.",
    text: "Vårt eget laboratorium analyserer kjemisk forurensning i levert masse og geotekniske egenskaper for de gjenvunne massene. Du får testsertifikater ved kjøp av sand, singel, grus og pukk – og eksperter som tolker resultatene.",
    bullets: ["Kjemisk analyse", "Testsertifikater", "TML-tester for sjøtransport", "Ekspertrådgivning"],
    href: "/laboratorium",
    cta: "Les om laboratoriet",
    image: "/assets/envir/envir-lab-detaljbilde-3.jpg",
  },
] as const;

/** Products & prices — /gjenvunne-masser (eks. mva). */
export const products = [
  { id: "0-2", name: "0–2 mm kabelsand", cat: "Kabelsand", min: 0, max: 2, price: 199, image: "/assets/envir/0_2_kabelsand.webp", text: "Kabelsand til beskyttelse av kabler og rør. Godt egnet til underlag for belegningsstein, tildekking av varmekabler i vei, sandkasser, fugesand mm." },
  { id: "0-8", name: "0–8 mm veigrus", cat: "Veigrus", min: 0, max: 8, price: 149, image: "/assets/envir/0_8_veigrus.webp", text: "Smådrenerende singel for overflatevannhåndtering, gangstier, lekeplasser og pynt. Tilpasset finere detaljer i landskap." },
  { id: "0-16", name: "0–16 mm veigrus", cat: "Veigrus", min: 0, max: 16, price: 149, image: "/assets/envir/0_16_veigrus.webp", text: "Smådrenerende singel for overflatevannhåndtering, gangstier, lekeplasser og pynt. Tilpasset finere detaljer i landskap." },
  { id: "0-32", name: "0–32 mm grus", cat: "Veigrus", min: 0, max: 32, price: 149, image: "/assets/envir/0_32_grus.webp", text: "Smådrenerende singel for overflatevannhåndtering, gangstier, lekeplasser og pynt. Tilpasset finere detaljer i landskap." },
  { id: "2-8", name: "2–8 mm singel", cat: "Singel", min: 2, max: 8, price: 159, image: "/assets/envir/2_8_singel.webp", text: "Smådrenerende singel for overflatevannhåndtering, gangstier, lekeplasser og pynt. Tilpasset finere detaljer i landskap." },
  { id: "8-16", name: "8–16 mm singel", cat: "Singel", min: 8, max: 16, price: 179, image: "/assets/envir/8_16_singel.webp", text: "Drenerende singel til hage, stier og gangveier, omfylling rør." },
  { id: "16-32", name: "16–32 mm pukk", cat: "Pukk", min: 16, max: 32, price: 149, image: "/assets/envir/16_32_pukk.webp", text: "Egner seg til drenering, veibygging, fylling i grøfter og inntil betongkonstruksjoner." },
  { id: "16-64", name: "16–64 mm pukk", cat: "Pukk", min: 16, max: 64, price: 149, image: "/assets/envir/16_64_pukk.webp", text: "Grovere pukk til større dreneringsoppgaver, fyllmasse og fundamentering." },
  { id: "32-64", name: "32–64 mm pukk", cat: "Pukk", min: 32, max: 64, price: 149, image: "/assets/envir/32_64_pukk.webp", text: "Stor pukk til tyngre konstruksjoner, fylling og drenering under veier og bygg." },
  { id: "64-90", name: "64–90 mm pukk", cat: "Pukk", min: 64, max: 90, price: 149, image: "/assets/envir/64_90_pukk.webp", text: "Ekstra grov pukk til store dreneringsprosjekter, erosjonssikring og tunge fyllingsarbeider." },
  { id: "jord-uten", name: "Anleggsjord uten sand", cat: "Jord", min: null, max: null, spec: "Fin fraksjon", price: 399, image: "/assets/envir/jord_uten_sand.webp", text: "Garantert ugressfri jord som kan brukes av bygge- og anleggsbransjen til formål som parker, landskapsforming, skjæringer, leke-/idrettsplasser og hagebruk." },
  { id: "jord-med", name: "Anleggsjord med sand", cat: "Jord", min: null, max: null, spec: "Med sandblanding", price: 399, image: "/assets/envir/jord_med_sand.webp", text: "Garantert ugressfri jord som kan brukes av bygge- og anleggsbransjen til formål som parker, landskapsforming, skjæringer, leke-/idrettsplasser og hagebruk." },
  { id: "big-bag", name: "Big Bag", cat: "Big Bag", min: null, max: null, spec: "Valgfri fraksjon", price: null, image: "/assets/envir/big_bag.webp", text: "Fleksibel og praktisk løsning for leveranse av masser som pukk, sand og jord. CE-merkede materialer som er gjenvunnet, vasket og fri for støv og finstoff." },
] as const;

export const productCats = ["Alle", "Pukk", "Singel", "Veigrus", "Kabelsand", "Jord", "Big Bag"] as const;

export const receptionPrices = [
  { label: "Forurensede masser kl. 2 til 5", price: "Kr 499,-" },
  { label: "Jord med uønskede fremmede arter", price: "Kr 539,-" },
];

export const priceNote = "Alle priser er oppgitt eks. mva. og kan endres uten varsel.";

/** Sustainability — /baerekraft */
export const sustainability = {
  intro:
    "Det grønne skiftet er ikke bare nødvendig for miljøet, det er også økonomisk smart. Snart vil det koste mer å ikke velge sirkulære og klimasmarte løsninger, og allerede nå er det lønnsomt å bruke gjenvunne masser.",
  context: [
    { v: "40%", l: "av globale CO2-utslipp fra bygg- og anlegg" },
    { v: "65%", l: "gjenvinningskrav innen 2035" },
    { v: "<1%", l: "gjenvinningsgrad for lett forurensede gravemasser" },
    { v: "30%", l: "klimavekting i offentlige anbud fra 2024" },
  ],
  lca: [
    { v: 28, short: "Behandling i jordvaskeanlegget sammenlignet med deponering", text: "Behandling i Envirs jordvaskeanlegg reduserer klimagassutslippene med 28 % sammenlignet med deponering." },
    { v: 74, short: "Gjenvunne materialer sammenlignet med jomfruelige materialer", text: "Produksjon av gjenvunne materialer hos Envir reduserer klimagassutslippene med 74 % sammenlignet med produksjon av jomfruelige materialer." },
    { v: 61, short: "0/8 til betong fra sandblandeverket sammenlignet med jomfruelig 0/8", text: "Blanding med vårt nye sandblandeverk for produksjon av 0/8 til betong reduserer klimagassutslippene med 61 % sammenlignet med produksjon av jomfruelig 0/8." },
  ],
  lcaMethod:
    "Analysen er utført av NORSUS i samsvar med ISO 14040/14044 og EN 15804, og omfatter miljøpåvirkningen fra massene graves opp på byggeplass og leveres til Envir, frem til gjenvunne materialer lastes på lastebiler klar for utkjøring. Transport fra Envirs anlegg til byggeplass er ikke inkludert. LCA-rapporten ble ferdigstilt i april 2026.",
  frameworks: [
    { title: "EU-krav & regelverk", text: "Nye lover fra EU krever at minst 65% av byggavfall skal gjenvinnes innen 2035." },
    { title: "30% miljøvekting", text: "Fra 1. januar 2024 må klima- og miljøhensyn vektes minst 30% i offentlige anbud." },
    { title: "FNs bærekraftsmål", text: "Envir bidrar til mål 9, 11, 12 og 15 gjennom sirkulær ressursbruk." },
    { title: "BREEAM Infrastructure", text: "Envir støtter BREEAM Infrastructure-sertifisering med gjenvinning, gjenbruk og dokumentert LCA – fra tidligfase til gjennomføring." },
  ],
  sdg: [
    { n: 9, t: "Industri, innovasjon og infrastruktur" },
    { n: 11, t: "Bærekraftige byer og lokalsamfunn" },
    { n: 12, t: "Ansvarlig forbruk og produksjon" },
    { n: 15, t: "Livet på land" },
  ],
};

/** Circular flow stages (labels per brief; descriptions from envir.com pages). */
export const circleStages = [
  { id: "graving", label: "Graving", text: "Forurensede masser graves opp på byggeplass. Envir kan bistå med rådgivning om massehåndtering allerede i anbuds- og planleggingsfasen." },
  { id: "mottak", label: "Mottak", text: "Massene veies inn og kontrolleres. Dokumentasjon som miljøteknisk grunnundersøkelse eller tiltaksplan må foreligge før levering." },
  { id: "behandling", label: "Behandling", text: "Vask med vann uten kjemikalier, eller damping ved 94 °C for jord med fremmedarter. Filterkakene med forurensning går til deponi." },
  { id: "kvalitet", label: "Kvalitetskontroll", text: "Laboratoriet analyserer alle gjenvunne masser, og du får testsertifikater ved kjøp av sand, singel, grus og pukk." },
  { id: "masser", label: "Gjenvunne masser", text: "Opp til 80 % av massene gjenvinnes til CE-merket pukk, singel, grus, sand og anleggsjord." },
  { id: "prosjekter", label: "Nye prosjekter", text: "Massene brukes til drenering, veibygging, kabelgrøfter og betong – og reduserer behovet for jomfruelige masser og deponi." },
];

export const about = {
  title: "Et viktig bidrag til det grønne skiftet",
  text: "Envir ble grunnlagt i 2017 med et ønske om å bidra til en positiv forandring for naturen, og å hjelpe til med å gjenvinne en av de aller viktigste ressursene den gir oss mennesker. Jord! Vi er en ledende aktør innen gjenvinning av jord og gravemasser, som med bærekraftige og sirkulære løsninger hjelper vi deg å kutte kostnader, redusere CO₂-utslipp og reversere negativ miljøpåvirkning.",
  text2:
    "Vi har et av verdens mest komplette anlegg for gjenvinning av forurenset jord og gravemasser, lokalisert under 10 minutter fra Bergen sentrum. Anlegget vårt i Simonsviken på Laksevåg har kapasitet til å ta imot over 150 000 tonn masser i året.",
  facts: [
    { v: "2017", l: "grunnlagt" },
    { v: "Laksevåg", l: "Bergen" },
    { v: "19+", l: "ansatte" },
  ],
  timeline: [
    { year: "2017", title: "Grunnlagt", text: "Envir ble grunnlagt med en visjon om å bli et lønnsomt bidrag til det grønne skiftet gjennom gjenvinning av jord." },
    { year: "2019", title: "Jorddampeanlegg", text: "Lanserte jorddamping – en vitenskapelig dokumentert metode for å fjerne fremmede arter (ugress) fra jord." },
    { year: "2024", title: "Jordvaskeanlegg", text: "Et av verdens mest komplette anlegg for gjenvinning av forurenset jord og gravemasser ble satt i drift." },
    { year: "2026", title: "Laboratorium", text: "Eget laboratorium med avansert analyse og dokumentasjon av jordkvalitet." },
    { year: "3.0", title: "Envir 3.0", text: "Etter oppstartsfase, omorganisering, og med et profesjonelt og svært kompetent styre på plass, er Envir klar til å lede an i det grønne skiftet. Vi skal være beviset på lønnsom sirkulærøkonomi!" },
  ],
  quote: {
    text: "Jeg har fulgt Envir-prosjektet fra starten. Det er snakk om sirkulær økonomi, hvordan vi kan gjenbruke ressurser. Dette er sirkulær økonomi i praksis, det er miljøvern i praksis.",
    name: "Sveinung Rotevatn",
    role: "Tidligere klima- og miljøminister (V) og nåværende styreleder i Envir AS",
    image: "/assets/envir/rotevatn.webp",
  },
};

/** Key contacts — /kontakt */
export const contacts = [
  { name: "Rune Kristoffersen", role: "CEO", phone: "+47 924 17 546", email: "runek@envir.com", image: "/assets/team/rune_kristoffersen.webp" },
  { name: "Kolbjørn Akervold", role: "COO", phone: "+47 915 96 670", email: "kolbjorn@envir.com", image: "/assets/team/kolbjorn_akervold.webp" },
  { name: "Nina Rebnord", role: "Leder salg og marked", phone: "+47 948 42 593", email: "nina@envir.com", image: "/assets/team/nina_rebnord.jpg" },
  { name: "Fredrik Årvåg", role: "Driftsleder", phone: "+47 980 39 579", email: "fredrik@envir.com", image: "/assets/team/fredrik_arvag.webp" },
  { name: "Marianne Heimark", role: "Salgskonsulent / servicemedarbeider", phone: "+47 403 10 374", email: "marianne@envir.com", image: "/assets/team/marianne_heimark.jpg" },
];

/** Team — live CMS (team_members, visible=true), sort order preserved. */
export const team = [
  { name: "Rune Kristoffersen", role: "CEO", image: "/assets/team/rune_kristoffersen.webp" },
  { name: "Kolbjørn Akervold", role: "COO", image: "/assets/team/kolbjorn_akervold.webp" },
  { name: "Rune Indrøy", role: "CSO", image: "/assets/team/rune_indroy.jpg" },
  { name: "Nina Rebnord", role: "Leder salg og marked", image: "/assets/team/nina_rebnord.jpg" },
  { name: "Fredrik Årvåg", role: "Driftsleder", image: "/assets/team/fredrik_arvag.webp" },
  { name: "Marianne Heimark", role: "Salgskonsulent / servicemedarbeider", image: "/assets/team/marianne_heimark.jpg" },
  { name: "Kristin Aa", role: "Fagansvarlig jord", image: "/assets/team/kristin_aa.jpg" },
  { name: "Elisabeth Nesse", role: "Kvalitetsansvarlig", image: "/assets/team/elisabeth_nesse.webp" },
  { name: "Anne Husby Rosnes", role: "Miljørådgiver", image: "/assets/team/anne_husby_rosnes.jpg" },
  { name: "Jo Hellesund", role: "Laboratorieleder", image: "/assets/team/jo_hellesund.jpg" },
  { name: "Artur Ferensowicz", role: "Labtekniker", image: "/assets/team/artur_ferensowicz.jpg" },
  { name: "Heino Skjold Danielsen", role: "Operatør / Verneombud", image: "/assets/team/heino_danielsen.webp" },
  { name: "Aurel Constantinica", role: "Operatør", image: "/assets/team/aurel_constantinica.webp" },
  { name: "Franz R. Herbst", role: "Driftsoperatør", image: "/assets/team/franz_r_herbst.jpg" },
  { name: "Øystein Lauritsen", role: "Operatør", image: "/assets/team/oystein_lauritsen.webp" },
  { name: "Tobias Utne", role: "Operatør", image: "/assets/team/tobias_utne.webp" },
  { name: "Bjørn Silkoset", role: "Operatør", image: "/assets/team/bjorn_silkoset.jpg" },
  { name: "Helge Herland", role: "Operatør", image: "/assets/team/helge_herland.jpg" },
  { name: "Andreas Løyland", role: "Operatør", image: "/assets/team/andreas_loyland.webp" },
  { name: "Trude Ingebrigtsen Bjørnestad", role: "HR", image: "/assets/team/trude_bjornestad.webp" },
];

/** Contact form service options — homepage form on envir.com. */
export const serviceOptions = [
  "Massemottak",
  "Kjøp av gjenvunne masser",
  "Forespørsel om tilbud",
  "Jordbehandling & analyse",
  "Laboratorietjenester",
  "Samarbeid / partnerskap",
  "Annet",
];

export const faq = [
  {
    group: "Massemottak",
    items: [
      { q: "Hvilke typer forurensede masser tar Envir imot?", a: "Envir tar imot forurenset jord og gravemasser i tilstandsklasse 1–5 i henhold til Miljødirektoratets veileder TA-2553, samt inerte og lettere forurensede masser fra bygg- og anleggsprosjekter. Vi mottar også masser med tungmetaller, PAH, olje og PFAS. Analyseresultater fra akkreditert laboratorium må foreligge før leveranse godkjennes." },
      { q: "Hvordan bestiller jeg time for levering av masser til Envir?", a: "Alle leveranser til Envirs anlegg i Laksevåg må avtales på forhånd. Send en e-post til post@envir.com eller ring +47 55 200 400 med volum, opphavssted, analyserapport og ønsket leveringsdato, så bekrefter vi mottak innen én arbeidsdag." },
      { q: "Hva er åpningstidene for Envirs massemottak i Bergen?", a: "Massemottaket på Sjøkrigsskoleveien 15 i Laksevåg er åpent mandag til fredag klokken 07:00–16:00. Lørdag, søndag og på norske helligdager holder anlegget stengt. Etter avtale kan vi ta imot større leveranser utenfor ordinær åpningstid." },
      { q: "Hva koster det å levere forurensede masser?", a: "Prisen på mottak avhenger av tilstandsklasse, forurensningstype og volum. Envir gir tilbud basert på analyserapport og prosjektbeskrivelse. Bruk vår priskalkulator eller kontakt Nina Rebnord (nina@envir.com) for et konkret tilbud." },
    ],
  },
  {
    group: "Gjenvunne masser",
    items: [
      { q: "Hvilke gjenvunne produkter selger Envir?", a: "Envir selger sirkulær sand, singel, grus og pukk i standardfraksjoner som 0/2 mm kabelsand, 0/8 mm veigrus, 8/16 mm singel, 16/32 mm pukk og 32/64 mm pukk. Vi leverer også jord med og uten sand, samt storsekk (big bag) for mindre prosjekter. Alle produkter er produsert av rensede masser fra vårt jordvaskeanlegg i Bergen." },
      { q: "Er de gjenvunne massene testet, sporbare og dokumenterte?", a: "Ja. Hvert parti gjenvunne masser analyseres i Envirs eget akkrediterte laboratorium på Laksevåg. Du får testsertifikat med batch-nummer, sporbarhet fra opprinnelig masse til ferdig produkt, og dokumentasjon som kan brukes direkte i BREEAM Infrastructure-, ISO 14001- og anbudsprosesser." },
      { q: "Kan jeg hente masser selv, eller leverer Envir?", a: "Begge deler. Du kan hente på Envirs anlegg i Laksevåg i åpningstiden, eller vi organiserer transport med lastebil eller båt. Vi har ISPS-godkjent kai i Bergen, som gjør det mulig å sende store volumer sirkulære masser via sjøvei langs hele norskekysten og ut i Europa." },
    ],
  },
  {
    group: "Bærekraft og kvalitet",
    items: [
      { q: "Hvorfor er gjenvunne masser mer bærekraftig enn jomfruelige materialer?", a: "Behandling i Envirs jordvaskeanlegg reduserer klimagassutslipp med rundt 80 % sammenlignet med deponering og produksjon av jomfruelige materialer, ifølge vår livssyklusanalyse (LCA). I tillegg spares uttak av naturgrus og pukk, og forurensede masser holdes ute av naturen. Dette bidrar direkte til FNs bærekraftsmål 9, 11, 12 og 13." },
      { q: "Kan Envirs masser brukes i BREEAM Infrastructure-prosjekter?", a: "Ja. Envir støtter BREEAM Infrastructure-sertifiserte prosjekter med sirkulære materialer, full sporbarhet, tredjepartsdokumentasjon og LCA-data. Vi samarbeider gjerne tidlig i prosjektfasen for å kartlegge hvilke BREEAM-kriterier vi kan bidra til, blant annet innen ressursbruk, klima, avfall og transport." },
      { q: "Hvor holder Envir til?", a: "Envir har hovedanlegget sitt på Sjøkrigsskoleveien 15 i Laksevåg, Bergen (5165). Anlegget omfatter Norges mest avanserte jordvaskeanlegg, jorddampeanlegg, laboratorium og ISPS-godkjent kai, og betjener kunder i hele Vestland og resten av Norge." },
    ],
  },
  {
    group: "Laboratorium og analyse",
    items: [
      { q: "Kan Envir analysere prøver fra mine egne prosjekter?", a: "Ja. Envirs laboratorium i Bergen tilbyr både kjemiske forurensningsanalyser (tungmetaller, PAH, olje, PFAS) og geotekniske analyser (kornfordeling, tørrstoff, glødetap). Vi leverer prøvetakingsutstyr, henter prøver ved behov, og returnerer resultatet med tolkning og tilstandsklassifisering – vanligvis innen 5–10 virkedager." },
      { q: "Hvor lang tid tar en analyse hos Envir?", a: "En standard prøve analyseres normalt innen 5–10 virkedager fra mottak. Envir tilbyr også hasteanalyse med svar innen 48–72 timer mot et tillegg. Kontakt laboratoriet på post@envir.com for å avtale prioritet og få oppgitt aktuell leveringstid." },
    ],
  },
];
