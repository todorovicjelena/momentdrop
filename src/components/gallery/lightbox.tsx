"use client";

/* eslint-disable @next/next/no-img-element -- presigned R2 URLs, not optimizable by next/image */
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2, X } from "lucide-react";
import type { GalleryItem } from "./gallery-grid";
import { useClosing, useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

// Full-screen viewer: photos and videos play in the page instead of opening
// the raw file (browsers download .mov files they're asked to open directly).
export function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  onDelete,
  onSave,
  subtitle,
}: {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onSave?: (item: GalleryItem) => void;
  subtitle: (item: GalleryItem) => string;
}) {
  const item = items[index];
  const touchX = useRef<number | null>(null);
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  // Esc and the page scroll lock are shared with the other overlays; `close`
  // lets the viewer fade out before it unmounts.
  const { closing, close } = useClosing(onClose);
  useModal(true, close);

  // ← → to browse, which is specific to the viewer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && hasNext) onIndexChange(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, hasPrev, hasNext, onIndexChange]);

  if (!item) return null;

  const button = "grid size-11 place-items-center rounded-full bg-cream/15 text-cream transition hover:bg-cream/25 active:scale-90";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.guestName}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-ink/95 text-cream backdrop-blur duration-200",
        closing ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in",
      )}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        // Swipe left / right on phones
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx > 60 && hasPrev) onIndexChange(index - 1);
        if (dx < -60 && hasNext) onIndexChange(index + 1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0 pl-2">
          <p className="truncate font-semibold">{item.guestName}</p>
          <p className="text-sm opacity-70">{subtitle(item)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {onSave ? (
            <button type="button" onClick={() => onSave(item)} className={button} aria-label={t.gallery.download} title={t.gallery.download}>
              <Download className="size-5" aria-hidden />
            </button>
          ) : (
            <a href={item.downloadUrl} className={button} aria-label={t.gallery.download} title={t.gallery.download}>
              <Download className="size-5" aria-hidden />
            </a>
          )}
          {item.canDelete && onDelete && (
            <button type="button" onClick={() => onDelete(item.id)} className={button} aria-label={t.gallery.delete} title={t.gallery.delete}>
              <Trash2 className="size-5" aria-hidden />
            </button>
          )}
          <button type="button" onClick={close} className={button} aria-label={t.gallery.close} title={t.gallery.close}>
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 sm:px-16">
        {item.kind === "image" ? (
          <img
            key={item.id}
            src={item.url}
            alt=""
            className={cn(
              "max-h-full max-w-full rounded-xl object-contain",
              closing ? "animate-out duration-200 fade-out zoom-out-95 fill-mode-forwards" : "animate-in duration-300 fade-in zoom-in-95",
            )}
          />
        ) : item.kind === "video" ? (
          <video
            key={item.id}
            src={item.url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-xl bg-black"
          >
            {/* Shown only if the browser can't play this format at all */}
            <a href={item.downloadUrl} className="underline">
              {t.gallery.download}
            </a>
          </video>
        ) : (
          <audio key={item.id} src={item.url} controls autoPlay className="w-full max-w-md" />
        )}

        {hasPrev && (
          <button
            type="button"
            onClick={() => onIndexChange(index - 1)}
            className={`${button} absolute top-1/2 left-2 hidden -translate-y-1/2 sm:grid`}
            aria-label={t.gallery.previous}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            className={`${button} absolute top-1/2 right-2 hidden -translate-y-1/2 sm:grid`}
            aria-label={t.gallery.next}
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        )}
      </div>

      <p className="pb-4 text-center text-sm opacity-60">
        {index + 1} / {items.length}
      </p>
    </div>
  );
}
