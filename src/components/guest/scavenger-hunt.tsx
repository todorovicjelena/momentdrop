"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronDown, Images, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { useStoredValue } from "@/hooks/use-stored-value";
import { useGuestUploads } from "@/hooks/use-guest-uploads";
import { useT } from "@/components/i18n-provider";
import type { EventType } from "@/lib/events";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A checklist of fun photo prompts, each with its own attach button - picking
// a file there uploads it through the normal pipeline (compression, R2,
// uploads row) tagged with that prompt's index, so the host can later filter
// the gallery down to "every silly-face photo" instead of scrolling the
// whole album. A manual checkbox still exists alongside it (toggleable on
// its own) for guests who'd rather just self-report without re-uploading.
export function ScavengerHunt({ slug, eventType, guestsCanView }: { slug: string; eventType: EventType; guestsCanView: boolean }) {
  const messages = useT();
  const t = messages.scavengerHunt;
  const prompts = t.prompts[eventType];
  const [open, setOpen] = useState(false);
  const [checkedRaw, setCheckedRaw] = useStoredValue("local", `momentdrop:hunt:${slug}`);
  const checked = new Set((checkedRaw ?? "").split(",").filter(Boolean).map(Number));

  const [guestName] = useStoredValue("local", "momentdrop:guest-name");
  const [pin] = useStoredValue("session", `momentdrop:pin:${slug}`);
  const { items, addFiles } = useGuestUploads(slug);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  // So a finished upload only toasts once, even though `items` keeps updating.
  const announcedRef = useRef(new Set<string>());

  function setChecked(index: number, value: boolean) {
    const next = new Set(checked);
    if (value) next.add(index);
    else next.delete(index);
    setCheckedRaw([...next].join(","));
  }

  // Confirms each hunt-tagged upload as it finishes - a silent checkbox isn't
  // proof the photo actually made it to the gallery.
  useEffect(() => {
    for (const item of items) {
      if (item.huntPromptIndex === undefined || announcedRef.current.has(item.id)) continue;
      if (item.status === "done") {
        announcedRef.current.add(item.id);
        toast.success(t.sent(prompts[item.huntPromptIndex]));
      } else if (item.status === "error") {
        announcedRef.current.add(item.id);
        setChecked(item.huntPromptIndex, false);
        toast.error(t.sendFailed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setChecked/prompts/t.sent are stable for a given render pass
  }, [items]);

  function attach(index: number) {
    if (!guestName) return toast.info(t.needName);
    inputRefs.current[index]?.click();
  }

  function busyFor(index: number) {
    return items.some((it) => it.huntPromptIndex === index && (it.status === "preparing" || it.status === "uploading"));
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
              const busy = busyFor(index);
              return (
                <li key={prompt}>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border-2 px-2.5 py-2 text-sm font-medium transition-colors",
                      done ? "border-primary/30 bg-lilac-soft text-muted-foreground" : "border-border bg-card",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setChecked(index, !done)}
                      aria-pressed={done}
                      aria-label={prompt}
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {done && <Check className="size-3" aria-hidden />}
                    </button>
                    <span className={cn("flex-1 text-left", done && "line-through")}>{prompt}</span>
                    <button
                      type="button"
                      onClick={() => attach(index)}
                      disabled={busy}
                      aria-label={t.attach}
                      title={t.attach}
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:brightness-110 active:scale-90 disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
                    </button>
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/*,video/*"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.files?.length && guestName) {
                          addFiles(e.target.files, { guestName, pin: pin ?? "" }, index);
                          setChecked(index, true);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {guestsCanView && (
            <Link href={`/event/${slug}/gallery`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 w-full border-2")}>
              <Images aria-hidden />
              {messages.guest.viewGallery}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
