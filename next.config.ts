import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [70, 80],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // Keep the original downloadable asset URLs from envir.com working.
    return [
      { source: "/__l5e/assets-v1/:id/envir-prisliste-2026.pdf", destination: "/docs/envir-prisliste-2026.pdf", permanent: true },
      { source: "/__l5e/assets-v1/:id/envir-brosjyre.pdf", destination: "/docs/envir-brosjyre.pdf", permanent: true },
      { source: "/__l5e/assets-v1/:id/envir-lca-rapport.pdf", destination: "/docs/envir-lca-rapport.pdf", permanent: true },
      { source: "/blog/:slug", destination: "/blogg/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
