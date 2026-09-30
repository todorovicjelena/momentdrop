"use client";

/* eslint-disable @next/next/no-img-element -- presigned R2 URLs, not optimizable by next/image */
import { useEffect, useState } from "react";
import { getSlideshowItems, type SlideshowItem } from "@/app/slideshow/[id]/actions";
import { useT } from "@/components/i18n-provider";

const ADVANCE_MS = 7000; // per image; videos advance on their own when they end
const POLL_MS = 20000; // pick up new guest uploads without a manual refresh

// Full-screen, unattended photo/video cycle for a TV or projector.
export function SlideshowPlayer({ eventId, title }: { eventId: string; title: string }) {
  const t = useT();
  const [items, setItems] = useState<SlideshowItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const fresh = await getSlideshowItems(eventId);
      if (!cancelled) setItems(fresh);
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [eventId]);

  const current = items.length ? items[index % items.length] : undefined;

  // Auto-advance photos; videos call this themselves via onEnded instead.
  useEffect(() => {
    if (!items.length || current?.kind === "video") return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % items.length), ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [items, index, current]);

  if (!current) {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink px-6 text-center text-cream">
        <div>
          <p className="font-serif text-4xl">{title}</p>
          <p className="mt-3 text-cream/60">{t.slideshow.waiting}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink">
      {current.kind === "image" ? (
        <img
          key={current.id}
          src={current.url}
          alt=""
          className="max-h-dvh max-w-full animate-in object-contain duration-700 fade-in"
        />
      ) : (
        <video
          key={current.id}
          src={current.url}
          autoPlay
          muted
          playsInline
          className="max-h-dvh max-w-full animate-in object-contain duration-700 fade-in"
          onEnded={() => setIndex((i) => (i + 1) % items.length)}
        />
      )}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ink/60 px-4 py-1.5 text-sm font-semibold text-cream backdrop-blur">
        {current.guestName}
      </div>
    </main>
  );
}
