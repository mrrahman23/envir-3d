import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import RevealObserver from "@/components/RevealObserver";
import ScrollRefresh from "@/components/ScrollRefresh";
import { QualityProvider } from "@/lib/quality";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://envir.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Envir | Gjenvinning av jord og gravemasser i Bergen",
    template: "%s | Envir",
  },
  description:
    "Et av verdens mest komplette anlegg for gjenvinning av forurenset jord og gravemasser – under 10 minutter fra Bergen sentrum. Massemottak, gjenvunne masser, jordbehandling og laboratorium.",
  applicationName: "Envir",
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Envir",
    images: [{ url: "/assets/envir/fremside.webp", width: 1920, height: 1282, alt: "Envirs anlegg på Laksevåg i Bergen" }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0a2420",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Envir AS",
  url: siteUrl,
  logo: `${siteUrl}/assets/envir/envir-logo.svg`,
  telephone: "+4755200400",
  email: "post@envir.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sjøkrigsskoleveien 15",
    postalCode: "5165",
    addressLocality: "Laksevåg",
    addressRegion: "Bergen",
    addressCountry: "NO",
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "16:00" },
  ],
  sameAs: ["https://www.facebook.com/envir.as/", "https://www.instagram.com/envir_as/", "https://www.linkedin.com/company/envir/"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nb" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables reveal animations only when JS runs; content stays visible otherwise. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        <a href="#innhold" className="skip-link">
          Hopp til innhold
        </a>
        <QualityProvider>
          <Nav />
          <main id="innhold" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
        </QualityProvider>
        <RevealObserver />
        <ScrollRefresh />
      </body>
    </html>
  );
}
