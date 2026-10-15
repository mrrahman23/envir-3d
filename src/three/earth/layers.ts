/**
 * Schematic soil profile shared by the 3D cutaway and the static strata figure.
 * Thicknesses are believable illustrative values (metres), not local measurements.
 * Grain size ranges follow NS-EN ISO 14688-1.
 */
import { fbm } from "../noise";

export type LayerId = "topsoil" | "sand" | "gravel" | "mineral" | "bedrock";

export type Layer = {
  id: LayerId;
  name: string;
  line: string;
  /** Mean thickness in metres (bedrock: visible part of the block). */
  thickness: number;
  /** Amplitude of the irregular lower boundary (m). */
  wobble: number;
  /** Metres covered by one texture repeat — sets believable grain size. */
  tile: number;
  /** Mean albedo of the scan (for placeholders and the static figure). */
  colour: string;
};

export const LAYERS: Layer[] = [
  { id: "topsoil", name: "Matjord", line: "Organisk toppjord med røtter og humus", thickness: 0.32, wobble: 0.05, tile: 0.9, colour: "#352413" },
  { id: "sand", name: "Sand", line: "Kornstørrelse 0,063–2\u00a0mm", thickness: 0.5, wobble: 0.06, tile: 0.7, colour: "#938063" },
  { id: "gravel", name: "Grus", line: "Kornstørrelse 2–63\u00a0mm", thickness: 0.5, wobble: 0.07, tile: 0.75, colour: "#7f7569" },
  { id: "mineral", name: "Mineralmasse", line: "Knust stein og steinmasser", thickness: 0.5, wobble: 0.12, tile: 1.25, colour: "#787164" },
  { id: "bedrock", name: "Berggrunn", line: "Fast fjell under løsmassene", thickness: 1.0, wobble: 0, tile: 1.8, colour: "#564c3b" },
];

export const GEOLOGY_URL = "/assets/geology";

/** Monolith dimensions (metres). */
export const BLOCK = { w: 2.2, d: 1.4, bottom: -2.85 };
/** Mean depth of each upper boundary (0 = turf surface). */
export const DEPTHS = [0, 0.32, 0.82, 1.32, 1.82];
export const n2 = (x: number, y: number) => (fbm(x, y, 4) - 0.47) * 2;

/** Boundary k (0 = turf surface … 5 = block base) at (x, z). Shared by the slabs above and below it. */
export function boundary(k: number, x: number, z: number) {
  if (k === 0) return 0.012 * n2(x * 3 + 1.3, z * 3 + 7.1);
  if (k >= 5) return BLOCK.bottom;
  const w = LAYERS[k - 1].wobble;
  const f = 1.05 + k * 0.17;
  let n = n2(x * f + k * 9.7, z * f - k * 4.3);
  // Knobbly rock head: bedrock's upper surface is the most irregular.
  if (k === 4) n = 0.6 - Math.abs(n2(x * 0.9 + 3.1, z * 0.9 + 1.7)) * 2.2 + 0.35 * n2(x * 2.6, z * 2.6);
  return -DEPTHS[k] + w * n;
}
