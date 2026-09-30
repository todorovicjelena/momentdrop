"use client";

import { useState } from "react";
import { Eye, ImagePlus, Images, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DemoBackground } from "@/components/events/demo-background";
import { BRAND_COLORS } from "@/lib/events";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

// Numbered placeholder tiles instead of real photos — we don't have any to
// show, and picking real ones (someone's actual event, a stock photo) would
// either need rights we don't have or misrepresent an actual result.
const TILE_COLORS = BRAND_COLORS;

// Live-ish mockup of a guest page with "puna pozadina" turned on — lets a
// free-plan host see the actual look (both the send screen and the gallery)
// before paying for it, not just read about it.
export function BackgroundPreviewDialog() {
  const t = useT();
  const c = t.settings;
  const [tab, setTab] = useState<"send" | "gallery">("send");

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="gap-2">
            <Eye className="size-4" aria-hidden />
            {c.backgroundPreviewCta}
          </Button>
        }
      />
      <DialogContent>
        <div className="flex items-center justify-between">
          <DialogTitle>{c.backgroundPreviewTitle}</DialogTitle>
          <DialogClose
            render={
              <Button type="button" variant="ghost" size="icon-sm">
                <X aria-hidden />
                <span className="sr-only">{t.qr.close}</span>
              </Button>
            }
          />
        </div>

        <div className="relative isolate flex aspect-[4/5] flex-col items-center overflow-hidden rounded-[1.5rem] px-5 py-8 text-center text-cream sm:aspect-[3/4]">
          <DemoBackground />

          {tab === "send" ? (
            <>
              <span className="grid size-14 place-items-center rounded-full border-2 border-cream/70 font-serif text-lg">A · M</span>
              <p className="mt-4 text-xs font-semibold tracking-[0.2em] uppercase">Venčanje</p>
              <h3 className="mt-2 font-serif text-4xl leading-[0.95]">Ana &amp; Marko</h3>
              <p className="mt-3 text-sm opacity-90">15. avgust 2026.</p>
              <div className="mt-6 w-full max-w-[14rem] rounded-2xl bg-cream/90 px-4 py-3 text-sm leading-snug text-ink shadow-lg">
                {t.guest.defaultWelcome.wedding}
              </div>
            </>
          ) : (
            <div className="mt-4 grid w-full grid-cols-3 gap-2">
              {TILE_COLORS.map((color, i) => (
                <div
                  key={color}
                  className="grid aspect-square place-items-center rounded-xl text-lg font-semibold text-cream/90"
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto flex gap-2 pt-6">
            <TabButton active={tab === "send"} onClick={() => setTab("send")} icon={<ImagePlus className="size-4" aria-hidden />}>
              {t.guest.sendTab}
            </TabButton>
            <TabButton active={tab === "gallery"} onClick={() => setTab("gallery")} icon={<Images className="size-4" aria-hidden />}>
              {t.guest.galleryTitle}
            </TabButton>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">{c.backgroundPreviewNote}</p>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border-2 px-4 text-xs font-semibold whitespace-nowrap transition",
        active ? "border-cream bg-cream text-ink" : "border-cream/50 text-cream",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
