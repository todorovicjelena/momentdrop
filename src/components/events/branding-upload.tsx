"use client";

import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-field";
import { useBrandingUpload } from "@/hooks/use-branding-upload";
import { BRANDING, type BrandingKind } from "@/lib/events";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

// Logo (round) or cover (wide) picker with live preview and upload progress.
export function BrandingUpload({
  eventId,
  kind,
  initialUrl,
}: {
  eventId: string;
  kind: BrandingKind;
  initialUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { previewUrl, uploading, progress, error, upload, remove } = useBrandingUpload(eventId, kind, initialUrl);
  const isLogo = kind === "logo";
  const label = { logo: t.settings.logo, cover: t.settings.cover, background: t.settings.background }[kind];
  const hint = { logo: t.settings.logoHint, cover: t.settings.coverHint, background: t.settings.backgroundHint }[kind];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="pl-1 text-sm font-semibold">{label}</p>
        <p className="pl-1 text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className={cn("flex gap-4", isLogo ? "items-center" : "flex-col")}>
        <div
          className={cn(
            "relative grid shrink-0 place-items-center overflow-hidden border-2 border-dashed border-input bg-lilac-soft",
            isLogo ? "size-24 rounded-full" : "aspect-[5/2] w-full rounded-2xl",
          )}
        >
          {previewUrl ? (
            // Presigned R2 URL — plain <img>, it can't go through next/image optimization.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-7 text-muted-foreground" aria-hidden />
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-ink/50 text-sm font-semibold text-cream">
              {progress > 0 ? `${progress}%` : t.settings.uploading}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={BRANDING.mimeTypes.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = ""; // allow picking the same file again
            }}
          />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <ImagePlus aria-hidden />
            {previewUrl ? t.settings.replaceImage : t.settings.chooseImage}
          </Button>
          {previewUrl && (
            <Button type="button" variant="ghost" disabled={uploading} onClick={remove}>
              <Trash2 aria-hidden />
              {t.settings.removeImage}
            </Button>
          )}
        </div>
      </div>

      <FormError message={error ?? undefined} />
    </div>
  );
}
