"use client";

import { useState } from "react";
import { Check, ChevronDown, Target } from "lucide-react";
import { useStoredValue } from "@/hooks/use-stored-value";
import { useT } from "@/components/i18n-provider";
import type { EventType } from "@/lib/events";
import { cn } from "@/lib/utils";

// A self-reported checklist of fun photo prompts (no server, no AI check that
// an upload actually matches) - nudges guests toward varied, creative shots
// instead of fifty near-identical selfies, the same way a paper scavenger-hunt
// card works at a party. Checked state lives in this browser only.
export function ScavengerHunt({ slug, eventType }: { slug: string; eventType: EventType }) {
  const t = useT().scavengerHunt;
  const prompts = t.prompts[eventType];
  const [open, setOpen] = useState(false);
  const [checkedRaw, setCheckedRaw] = useStoredValue("local", `momentdrop:hunt:${slug}`);
  const checked = new Set((checkedRaw ?? "").split(",").filter(Boolean).map(Number));

  function toggle(index: number) {
    const next = new Set(checked);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setCheckedRaw([...next].join(","));
  }

  return (
    <div className="mt-4 w-full max-w-md rounded-[1.75rem] bg-cream p-5 text-ink shadow-xl">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2 font-semibold">
          <Target className="size-5 text-primary" aria-hidden />
          {t.title}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-muted-foreground">
          {checked.size}/{prompts.length}
          <ChevronDown className={cn("size-4 transition-transform duration-300", open && "rotate-180")} aria-hidden />
        </span>
      </button>

      {/* grid-template-rows 0fr↔1fr animates height smoothly, same trick as the FAQ accordion. */}
      <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="mt-2 text-sm text-muted-foreground">{t.hint}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {prompts.map((prompt, index) => {
              const done = checked.has(index);
              return (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-pressed={done}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      done ? "border-primary/30 bg-lilac-soft text-muted-foreground line-through" : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {done && <Check className="size-3" aria-hidden />}
                    </span>
                    {prompt}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
