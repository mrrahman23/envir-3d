import { getImageProps } from "next/image";

/**
 * Art-directed hero stills baked from the live scene (scripts/bake-hero-posters.mjs).
 * Plain <picture> so the browser picks one file per orientation with high fetch priority.
 * `unoptimized`: the baked WebPs are already sized and tuned (≈25 KB); the optimizer would
 * upscale them to the 1920 bucket and re-encode them 4× larger.
 */
function Still({ name }: { name: "hero-poster" | "hero-aerial" }) {
  const common = { alt: "", unoptimized: true } as const;
  const {
    props: { src: desktop },
  } = getImageProps({ ...common, src: `/assets/geo/${name}-desktop.webp`, width: 1440, height: 900 });
  const {
    props: { src: mobile, ...rest },
  } = getImageProps({ ...common, src: `/assets/geo/${name}-mobile.webp`, width: 780, height: 1688 });
  return (
    <picture>
      <source media="(min-aspect-ratio: 1/1)" srcSet={desktop} />
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img {...rest} src={mobile} loading="eager" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  );
}

/** First frame of the intro (globe): the live canvas fades in over it without a jump. */
export function GlobePoster() {
  return <Still name="hero-poster" />;
}

/** Settled aerial over Bergen (Sentinel-2 + Copernicus DEM render) for reduced motion / no WebGL. */
export function AerialStill() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <Still name="hero-aerial" />
    </div>
  );
}
