import type { MetadataRoute } from "next";
import posts from "@/content/posts.json";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://envir.com";

const routes = [
  "",
  "/mottak",
  "/gjenvunne-masser",
  "/jordvaskeanlegg",
  "/jorddampeanlegg",
  "/laboratorium",
  "/kompetansesenter",
  "/isps-kai",
  "/baerekraft",
  "/om-oss",
  "/team",
  "/kontakt",
  "/nyheter",
  "/faq",
  "/personvern",
  "/vilkar",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...routes.map((r) => ({ url: `${base}${r}`, changeFrequency: "monthly" as const, priority: r === "" ? 1 : 0.7 })),
    ...posts.map((p) => ({ url: `${base}/blogg/${p.slug}`, lastModified: p.date, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
