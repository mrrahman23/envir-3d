import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Brukervilkår", alternates: { canonical: "/vilkar" } };

export default function VilkarPage() {
  return <LegalPage doc="vilkar" eyebrow="Vilkår" />;
}
