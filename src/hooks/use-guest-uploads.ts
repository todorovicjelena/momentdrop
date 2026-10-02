"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { confirmGuestUpload, deleteMyUpload, presignGuestUpload } from "@/app/event/[slug]/actions";
import { guestToken } from "@/hooks/use-stored-value";
import { putWithProgress } from "@/lib/upload-client";
import { fileExtension, fileKind, maxBytes, maxMb, toMb, UPLOAD_LIMITS, type FileKind } from "@/lib/uploads";
import { useT } from "@/components/i18n-provider";

export type UploadStatus = "waiting" | "preparing" | "uploading" | "done" | "error";

export type UploadItem = {
  id: string;
  name: string;
  kind: FileKind | null;
  previewUrl: string | null;
  status: UploadStatus;
  progress: number;
  error?: string;
  retryable?: boolean; // false for problems a retry can't fix (wrong type, too big…)
  uploadId?: string; // set once saved — lets the guest delete it again
  huntPromptIndex?: number; // which scavenger-hunt prompt this was sent for, if any
};

// Weak signal at venues: 2 parallel uploads is a good balance.
const CONCURRENCY = 2;

// Some browsers leave file.type empty for HEIC / MOV — fall back to the extension.
function mimeOf(file: File) {
  if (file.type) return file.type === "image/jpg" ? "image/jpeg" : file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ({ heic: "image/heic", heif: "image/heif", mov: "video/quicktime", mp4: "video/mp4" } as Record<string, string>)[ext ?? ""] ?? "";
}

function videoDuration(file: File) {
  return new Promise<number | undefined>((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (value?: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : undefined);
    video.onerror = () => done(undefined);
    video.src = url;
  });
}

function audioDuration(file: File) {
  return new Promise<number | undefined>((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    const done = (value?: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : undefined);
    audio.onerror = () => done(undefined);
    audio.src = url;
  });
}

async function imageSize(blob: Blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {}; // e.g. HEIC outside Safari
  }
}

// Resize big photos in the browser (saves the guest's mobile data). HEIC can't be
// decoded by most browsers, so it's uploaded as-is.
async function prepareImage(file: File, mime: string): Promise<File | Blob> {
  if (mime === "image/heic" || mime === "image/heif") return file;
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: UPLOAD_LIMITS.imageMaxDimension,
      initialQuality: UPLOAD_LIMITS.imageQuality,
      maxSizeMB: 4,
      useWebWorker: true,
    });
  } catch {
    return file;
  }
}

type Identity = { guestName: string; pin: string };

export function useGuestUploads(slug: string) {
  const t = useT();
  const errors = t.guest.errors;
  const [items, setItems] = useState<UploadItem[]>([]);
  // Source of truth lives in refs so async tasks always see fresh data.
  const itemsRef = useRef<UploadItem[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const activeRef = useRef(0);
  const identityRef = useRef<Identity>({ guestName: "", pin: "" });
  const pumpRef = useRef<() => void>(() => {});

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    itemsRef.current = itemsRef.current.map((it) => (it.id === id ? { ...it, ...patch } : it));
    setItems(itemsRef.current);
  }, []);

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      const file = filesRef.current.get(item.id)!;
      const { guestName, pin } = identityRef.current;
      const fail = (error: string, retryable = true) => update(item.id, { status: "error", error, retryable });

      const mime = mimeOf(file);
      const kind = fileKind(mime);
      if (!kind) return fail(errors.fileType(fileExtension(file.name)), false);

      update(item.id, { status: "preparing", progress: 0, error: undefined });

      let body: Blob = file;
      let durationSeconds: number | undefined;
      let dims: { width?: number; height?: number } = {};
      if (kind === "video") {
        durationSeconds = await videoDuration(file);
        if (durationSeconds && durationSeconds > UPLOAD_LIMITS.maxVideoSeconds + 0.5) {
          return fail(errors.videoTooLong(durationSeconds), false);
        }
      } else if (kind === "audio") {
        durationSeconds = await audioDuration(file);
        if (durationSeconds && durationSeconds > UPLOAD_LIMITS.maxAudioSeconds + 0.5) {
          return fail(errors.audioTooLong(durationSeconds), false);
        }
      } else {
        body = await prepareImage(file, mime);
        dims = await imageSize(body);
      }
      if (body.size > maxBytes(kind)) return fail(errors.tooBig(toMb(body.size), kind, maxMb(kind)), false);

      try {
        const token = guestToken();
        const presigned = await presignGuestUpload(slug, { guestToken: token, pin, mime, size: body.size, durationSeconds });
        if (!presigned.ok) return fail(presigned.error);

        update(item.id, { status: "uploading" });
        // Re-wrap so the Content-Type header matches what the URL was signed for.
        await putWithProgress(presigned.url, new Blob([body], { type: mime }), (p) => update(item.id, { progress: p }));

        const saved = await confirmGuestUpload(slug, {
          guestToken: token,
          guestName,
          pin,
          key: presigned.key,
          mime,
          ...dims,
          durationSeconds,
          huntPromptIndex: item.huntPromptIndex,
        });
        if (!saved.ok) return fail(saved.error);
        update(item.id, { status: "done", progress: 100, uploadId: saved.id });
      } catch (e) {
        console.error("guest upload failed", e);
        fail(errors.failed);
      }
    },
    [slug, update, errors],
  );

  const pump = useCallback(() => {
    while (activeRef.current < CONCURRENCY) {
      const next = itemsRef.current.find((it) => it.status === "waiting");
      if (!next) return;
      activeRef.current += 1;
      update(next.id, { status: "preparing" });
      uploadOne(next).finally(() => {
        activeRef.current -= 1;
        pumpRef.current();
      });
    }
  }, [update, uploadOne]);
  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const addFiles = useCallback(
    (files: FileList | File[], identity: Identity, huntPromptIndex?: number) => {
      identityRef.current = identity;
      const added = Array.from(files).map((file): UploadItem => {
        const id = crypto.randomUUID();
        filesRef.current.set(id, file);
        const kind = fileKind(mimeOf(file));
        // Catch what we can right away (format, video size); video length is checked when it's its turn.
        const error = !kind
          ? errors.fileType(fileExtension(file.name))
          : kind === "video" && file.size > maxBytes("video")
            ? errors.tooBig(toMb(file.size), "video", maxMb("video"))
            : undefined;
        return {
          id,
          name: file.name,
          kind,
          previewUrl: kind === "image" ? URL.createObjectURL(file) : null,
          status: error ? "error" : "waiting",
          progress: 0,
          error,
          retryable: error ? false : undefined,
          huntPromptIndex,
        };
      });
      const rejected = added.filter((it) => it.status === "error").length;
      if (rejected > 0) toast.error(errors.someRejected(rejected));
      itemsRef.current = [...itemsRef.current, ...added];
      setItems(itemsRef.current);
      pump();
    },
    [pump, errors],
  );

  const retry = useCallback(
    (id?: string) => {
      itemsRef.current = itemsRef.current.map((it) =>
        it.status === "error" && it.retryable !== false && (!id || it.id === id) ? { ...it, status: "waiting", error: undefined, progress: 0 } : it,
      );
      setItems(itemsRef.current);
      pump();
    },
    [pump],
  );

  // Guest changed their mind: delete an already-sent file.
  const removeSent = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (!item?.uploadId) return;
      const result = await deleteMyUpload(slug, {
        uploadId: item.uploadId,
        guestToken: guestToken(),
        pin: identityRef.current.pin,
      });
      if (!result.ok) return void toast.error(result.error);
      toast.success(t.gallery.deleted(1));
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      filesRef.current.delete(id);
      itemsRef.current = itemsRef.current.filter((it) => it.id !== id);
      setItems(itemsRef.current);
    },
    [slug, t],
  );

  const clear = useCallback(() => {
    itemsRef.current.forEach((it) => it.previewUrl && URL.revokeObjectURL(it.previewUrl));
    itemsRef.current = [];
    filesRef.current.clear();
    setItems([]);
  }, []);

  const done = items.filter((it) => it.status === "done").length;
  const failed = items.filter((it) => it.status === "error").length;
  const retryable = items.some((it) => it.status === "error" && it.retryable !== false);
  const busy = items.some((it) => it.status === "waiting" || it.status === "preparing" || it.status === "uploading");

  return { items, addFiles, retry, removeSent, clear, done, failed, retryable, busy };
}
