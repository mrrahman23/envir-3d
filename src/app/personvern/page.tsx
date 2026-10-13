import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Personvern", alternates: { canonical: "/personvern" } };

export default function PersonvernPage() {
  return <LegalPage doc="personvern" eyebrow="Personvern" />;
}
