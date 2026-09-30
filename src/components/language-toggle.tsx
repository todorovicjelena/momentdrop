"use client";

import { useState, useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import { useLocale } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

const OPTIONS = ["sr", "en"] as const;

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [bridge, setBridge] = useState<{ key: number; from: "sr" | "en" } | null>(null);

  function handleSwitch(l: (typeof OPTIONS)[number]) {
    if (pending || locale === l) return;
    setBridge((b) => ({ key: (b?.key ?? 0) + 1, from: locale }));
    window.setTimeout(() => setBridge(null), 620);
    startTransition(() => setLocale(l));
  }

  return (
    // contain:layout guards against a Chromium quirk where an absolutely
    // positioned, explicitly-sized box inside nested flex containers can
    // intermittently collapse to zero height.
    <div className={cn("relative h-8 w-20", className)} style={{ contain: "layout" }}>
      {OPTIONS.map((l, i) => (
        <button
          key={l}
          type="button"
          disabled={pending || locale === l}
          onClick={() => handleSwitch(l)}
          className={cn(
            "absolute top-0 flex size-8 items-center justify-center rounded-full text-[10px] font-bold uppercase",
            i === 0 ? "left-0" : "right-0",
            locale === l ? "bg-blaze text-cream" : "bg-border text-muted-foreground hover:bg-border/70",
          )}
        >
          {l}
        </button>
      ))}
      {/* Liquid merge: the active dot stretches into a pill bridging both
          positions, then contracts back down over the newly-active side. */}
      {bridge && (
        <span
          key={bridge.key}
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0 h-8 rounded-full bg-blaze",
            bridge.from === "en"
              ? "[animation:bridge-expand-from-en_620ms_cubic-bezier(.5,0,.2,1)_forwards]"
              : "[animation:bridge-expand_620ms_cubic-bezier(.5,0,.2,1)_forwards]",
          )}
        />
      )}
    </div>
  );
}
