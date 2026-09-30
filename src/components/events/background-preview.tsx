"use client";

import { Camera } from "lucide-react";
import { Swirls } from "@/components/swirls";
import { useT } from "@/components/i18n-provider";

// Small before/after teaser shown to free-plan hosts, next to the locked
// "puna pozadina" upload — makes the upsell concrete instead of just text.
export function BackgroundPreview() {
  const c = useT().settings;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="relative isolate h-28 overflow-hidden rounded-2xl">
          <Swirls />
        </div>
        <p className="text-center text-xs text-muted-foreground">{c.backgroundPreviewBefore}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="relative isolate grid h-28 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blaze to-secondary text-cream">
          <Camera className="size-7" aria-hidden />
        </div>
        <p className="text-center text-xs text-muted-foreground">{c.backgroundPreviewAfter}</p>
      </div>
    </div>
  );
}
