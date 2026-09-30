"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, FormField } from "@/components/form-field";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { deleteMyUpload, listGuestGallery, type GuestGalleryItem } from "@/app/event/[slug]/actions";
import { guestToken, useStoredValue } from "@/hooks/use-stored-value";
import { useT } from "@/components/i18n-provider";

// Loads through a Server Action because the PIN (if any) lives in this
// browser's sessionStorage, which the server can't read during render.
export function GuestGallery({ slug, hasPin }: { slug: string; hasPin: boolean }) {
  const g = useT().guest;
  const [pin, setPin] = useStoredValue("session", `momentdrop:pin:${slug}`);
  const [items, setItems] = useState<GuestGalleryItem[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const needsPin = hasPin && !pin;

  useEffect(() => {
    if (needsPin) return;
    let cancelled = false;
    listGuestGallery(slug, pin ?? "", guestToken()).then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.items);
      else {
        setError(result.error);
        if (result.error === g.errors.wrongPin) setPin(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug, pin, needsPin, setPin, g]);

  if (needsPin) {
    return (
      <form
        className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-[1.75rem] bg-cream p-6 text-left text-ink shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("pin") ?? "").trim();
          startTransition(async () => {
            const result = await listGuestGallery(slug, value);
            if (!result.ok) return setError(result.error);
            setError(undefined);
            setPin(value);
          });
        }}
      >
        <FormField id="gallery-pin" label={g.pin} hint={g.pinHint}>
          <Input id="gallery-pin" name="pin" inputMode="numeric" autoComplete="off" required maxLength={8} className="tracking-[0.3em]" />
        </FormField>
        <FormError message={error} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />}
          {g.continue}
        </Button>
      </form>
    );
  }

  if (error) return <p className="rounded-2xl bg-cream/90 px-4 py-3 text-ink">{error}</p>;
  if (!items) return <Loader2 className="mx-auto size-8 animate-spin" aria-label="…" />;
  if (items.length === 0) return <p className="rounded-2xl bg-cream/90 px-4 py-3 text-ink">{g.galleryEmpty}</p>;
  return (
    <GalleryGrid
      items={items.map((it) => ({ ...it, canDelete: it.mine }))}
      onDelete={async (id) => {
        const result = await deleteMyUpload(slug, { uploadId: id, guestToken: guestToken(), pin: pin ?? "" });
        if (result.ok) setItems((prev) => prev?.filter((it) => it.id !== id) ?? null);
        return result;
      }}
      confirmText={g.confirmDeleteMine}
      confirmHint={g.confirmDeleteMineHint}
      zipName={`${slug}.zip`}
    />
  );
}
