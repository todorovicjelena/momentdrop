"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import {
  presignBrandingUpload,
  removeBrandingImage,
  saveBrandingImage,
} from "@/app/dashboard/events/[id]/actions";
import { putWithProgress } from "@/lib/upload-client";
import { BRANDING, type BrandingKind } from "@/lib/events";
import { useT } from "@/components/i18n-provider";

type Status = "idle" | "working";

// Logo / cover upload: compress in the browser → get a presigned URL →
// PUT straight to R2 (with progress) → tell the server to save the key.
export function useBrandingUpload(eventId: string, kind: BrandingKind, initialUrl: string | null) {
  const t = useT();
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!(BRANDING.mimeTypes as readonly string[]).includes(file.type)) {
      setError(t.settings.errors.imageType);
      return;
    }
    setStatus("working");
    setProgress(0);
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: BRANDING.maxDimension[kind],
        maxSizeMB: 1.5,
        fileType: "image/webp", // small, and keeps transparency for logos
        initialQuality: 0.85,
        useWebWorker: true,
      });

      const presigned = await presignBrandingUpload(eventId, kind, compressed.type, compressed.size);
      if (!presigned.ok) throw new Error(presigned.error);

      await putWithProgress(presigned.url, compressed, setProgress);

      const saved = await saveBrandingImage(eventId, kind, presigned.key);
      if (!saved.ok) throw new Error(saved.error);
      setPreviewUrl(saved.previewUrl);
    } catch (e) {
      console.error(`${kind} upload failed`, e);
      // Show our own (translated) messages; anything else becomes a generic one.
      const known = Object.values(t.settings.errors) as string[];
      setError(e instanceof Error && known.includes(e.message) ? e.message : t.settings.errors.uploadFailed);
    } finally {
      setStatus("idle");
    }
  }

  async function remove() {
    setError(null);
    setStatus("working");
    const result = await removeBrandingImage(eventId, kind);
    setStatus("idle");
    if (result.ok) setPreviewUrl(null);
    else setError(result.error);
  }

  return { previewUrl, uploading: status === "working", progress, error, upload, remove };
}
