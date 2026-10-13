import { notFound } from "next/navigation";
import StudioClient from "./StudioClient";

/**
 * Development-only render studio used by scripts/render-assets.mjs to bake
 * product renders (public/assets/materials/renders). Returns 404 in production.
 */
export const metadata = { robots: { index: false, follow: false } };

export default function StudioPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StudioClient />;
}
