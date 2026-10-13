"use client";

import { useQuality } from "@/lib/quality";

export default function Footer3DToggle() {
  const { capable, enabled3D, set3D } = useQuality();
  if (!capable) return null;
  return (
    <button type="button" onClick={() => set3D(!enabled3D)} aria-pressed={enabled3D} className="inline-flex items-center gap-2 hover:text-white">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${enabled3D ? "bg-lime" : "bg-white/40"}`} />
      3D-visualiseringer: {enabled3D ? "på" : "av"}
    </button>
  );
}
