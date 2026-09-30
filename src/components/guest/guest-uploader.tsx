"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ImagePlus, Images, RotateCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useStoredValue } from "@/hooks/use-stored-value";
import { useGuestUploads } from "@/hooks/use-guest-uploads";
import { IdentityForm } from "./guest-identity-form";
import { AudioRecorder } from "./audio-recorder";
import { UploadRow } from "./upload-row";
import type { Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

export function GuestUploader({
  slug,
  hasPin,
  guestsCanView,
  plan,
}: {
  slug: string;
  hasPin: boolean;
  guestsCanView: boolean;
  plan: Plan;
}) {
  // Name is remembered on this phone; the PIN only for this browser session.
  const [name, setName] = useStoredValue("local", "momentdrop:guest-name");
  const [pin, setPin] = useStoredValue("session", `momentdrop:pin:${slug}`);
  const [editing, setEditing] = useState(false);

  const needsIdentity = editing || !name || (hasPin && !pin);
  if (needsIdentity) {
    return (
      <IdentityForm
        slug={slug}
        hasPin={hasPin}
        initialName={name ?? ""}
        onDone={(newName, newPin) => {
          setName(newName);
          if (hasPin) setPin(newPin);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <Uploader
      slug={slug}
      guestName={name ?? ""}
      pin={pin ?? ""}
      galleryHref={guestsCanView ? `/event/${slug}/gallery` : undefined}
      onChangeName={() => setEditing(true)}
      canRecordAudio={plan === "deluxe"}
    />
  );
}

function Uploader({
  slug,
  guestName,
  pin,
  galleryHref,
  onChangeName,
  canRecordAudio,
}: {
  slug: string;
  guestName: string;
  pin: string;
  galleryHref?: string; // only when the host lets guests see the gallery
  onChangeName: () => void;
  canRecordAudio: boolean;
}) {
  const g = useT().guest;
  const { items, addFiles, retry, removeSent, clear, done, failed, retryable, busy } = useGuestUploads(slug);
  const allFinished = items.length > 0 && !busy;

  if (allFinished && failed === 0) {
    return (
      <div className="flex animate-in flex-col items-center gap-3 py-2 duration-500 fade-in">
        <div className="grid size-16 animate-in place-items-center rounded-full bg-primary text-primary-foreground duration-500 zoom-in-50">
          <Check className="size-8" aria-hidden />
        </div>
        <p className="animate-in font-serif text-3xl duration-500 fade-in slide-in-from-bottom-2">{g.thanksTitle(guestName)}</p>
        <p className="animate-in text-muted-foreground duration-500 fade-in slide-in-from-bottom-2">{g.thanksText(done)}</p>
        <Button size="lg" className="mt-2 w-full" onClick={clear}>
          <ImagePlus aria-hidden />
          {g.sendMore}
        </Button>
        {galleryHref && <GalleryLink href={galleryHref} />}
        {/* Still listed so the guest can delete something they regret sending. */}
        <ul className="mt-2 flex w-full flex-col gap-2 text-left">
          {items.map((item) => (
            <UploadRow key={item.id} item={item} onRetry={() => retry(item.id)} onDelete={() => removeSent(item.id)} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{g.hello(guestName)}</p>
        <button type="button" onClick={onChangeName} className="text-sm text-muted-foreground underline underline-offset-4">
          {g.changeName}
        </button>
      </div>

      <label
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-[1.5rem] border-2 border-dashed border-primary/50 bg-lilac-soft px-4 py-6 text-center transition-colors hover:bg-lilac/40",
          "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        )}
      >
        <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
          <ImagePlus className="size-7" aria-hidden />
        </span>
        <span className="text-lg font-semibold">{g.pick}</span>
        <span className="text-sm text-muted-foreground">{g.pickHint}</span>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files, { guestName, pin });
            e.target.value = "";
          }}
        />
      </label>

      {canRecordAudio && <AudioRecorder onRecorded={(file) => addFiles([file], { guestName, pin })} />}

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{busy ? g.sending(done, items.length) : g.thanksText(done)}</span>
            {retryable && !busy && (
              <Button type="button" variant="outline" size="sm" onClick={() => retry()}>
                <RotateCw aria-hidden />
                {g.retryAll}
              </Button>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <UploadRow key={item.id} item={item} onRetry={() => retry(item.id)} onDelete={() => removeSent(item.id)} />
            ))}
          </ul>
        </>
      )}

      {galleryHref && <GalleryLink href={galleryHref} />}
    </div>
  );
}

function GalleryLink({ href }: { href: string }) {
  const g = useT().guest;
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full border-2")}>
      <Images aria-hidden />
      {g.viewGallery}
    </Link>
  );
}
