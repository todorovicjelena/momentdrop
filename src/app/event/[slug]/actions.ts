"use server";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { eventPinOk } from "@/lib/pin";
import { rateLimit } from "@/lib/rate-limit";
import { deleteObject, objectSize, presignPut } from "@/lib/r2";
import { mediaFileName, signMedia } from "@/lib/media";
import type { ActionResult } from "@/lib/result";
import { brandingKeyPrefix, isUploadClosed } from "@/lib/events";
import { EXTENSIONS, fileKind, GUEST_NAME_MAX, guestKeyPrefix, maxBytes, maxMb, toMb, UPLOAD_LIMITS, type FileKind } from "@/lib/uploads";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import { getT } from "@/lib/i18n/server";

// Guests have no account: every action re-checks the event, PIN and limits.
// Writes go through the admin (secret key) client — the uploads table has no
// insert policy for anonymous users on purpose.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function openEvent(slug: string, pin: string): Promise<ActionResult<{ id: string; plan: Plan }>> {
  const errors = (await getT()).guest.errors;
  const { data: event } = await createAdminClient()
    .from("events")
    .select("id, uploads_open, upload_deadline, pin_hash, plan, storage_expires_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) return { ok: false, error: errors.closed };
  if (isUploadClosed(event)) return { ok: false, error: errors.closed };
  if (!(await eventPinOk(event.pin_hash, pin))) return { ok: false, error: errors.wrongPin };
  return { ok: true, id: event.id, plan: event.plan as Plan };
}

async function guestFileCount(eventId: string, guestToken: string) {
  const { count } = await createAdminClient()
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("guest_token", guestToken);
  return count ?? 0;
}

async function eventFileCount(eventId: string) {
  const { count } = await createAdminClient()
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  return count ?? 0;
}

// Name + PIN step: lets the guest know right away if the PIN is wrong.
export async function checkGuestAccess(slug: string, pin: string): Promise<ActionResult> {
  const errors = (await getT()).guest.errors;
  if (!(await rateLimit("pin", 30))) return { ok: false, error: errors.rateLimit };
  const result = await openEvent(slug, pin);
  return result.ok ? { ok: true } : result;
}

type PresignInput = { guestToken: string; pin: string; mime: string; size: number; durationSeconds?: number };

export async function presignGuestUpload(slug: string, input: PresignInput): Promise<ActionResult<{ url: string; key: string }>> {
  const errors = (await getT()).guest.errors;
  if (!(await rateLimit("presign", 150))) return { ok: false, error: errors.rateLimit };
  if (!UUID.test(input.guestToken)) return { ok: false, error: errors.failed };

  const kind = fileKind(input.mime);
  if (!kind) return { ok: false, error: errors.fileType("") };
  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > maxBytes(kind)) {
    return { ok: false, error: errors.tooBig(toMb(input.size), kind, maxMb(kind)) };
  }
  if (kind === "video" && (input.durationSeconds ?? 0) > UPLOAD_LIMITS.maxVideoSeconds + 0.5) {
    return { ok: false, error: errors.videoTooLong(input.durationSeconds ?? 0) };
  }
  if (kind === "audio" && (input.durationSeconds ?? 0) > UPLOAD_LIMITS.maxAudioSeconds + 0.5) {
    return { ok: false, error: errors.audioTooLong(input.durationSeconds ?? 0) };
  }

  const event = await openEvent(slug, input.pin);
  if (!event.ok) return event;
  // Audio guestbook is a Premium-only perk — enforced here, not just hidden in the UI.
  if (kind === "audio" && event.plan !== "deluxe") {
    return { ok: false, error: errors.audioPremiumOnly };
  }
  if ((await guestFileCount(event.id, input.guestToken)) >= UPLOAD_LIMITS.maxFilesPerGuest) {
    return { ok: false, error: errors.limit };
  }
  if ((await eventFileCount(event.id)) >= PLAN_LIMITS[event.plan].maxUploads) {
    return { ok: false, error: errors.limit };
  }

  const key = `${guestKeyPrefix(event.id)}${randomUUID()}.${EXTENSIONS[input.mime]}`;
  return { ok: true, key, url: await presignPut(key, input.mime, input.size) };
}

type ConfirmInput = {
  guestToken: string;
  guestName: string;
  pin: string;
  key: string;
  mime: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export async function confirmGuestUpload(slug: string, input: ConfirmInput): Promise<ActionResult<{ id: string }>> {
  const errors = (await getT()).guest.errors;
  const kind = fileKind(input.mime);
  const guestName = input.guestName.trim().slice(0, GUEST_NAME_MAX);
  if (!kind || !guestName || !UUID.test(input.guestToken)) return { ok: false, error: errors.failed };

  const event = await openEvent(slug, input.pin);
  if (!event.ok) return event;

  // The key must be one we handed out for this event (not branding, not another event).
  const prefix = guestKeyPrefix(event.id);
  if (!input.key.startsWith(prefix) || input.key.startsWith(brandingKeyPrefix(event.id)) || input.key.slice(prefix.length).includes("/")) {
    return { ok: false, error: errors.failed };
  }

  const size = await objectSize(input.key);
  if (size === null) return { ok: false, error: errors.failed };
  if (size > maxBytes(kind)) {
    await deleteObject(input.key);
    return { ok: false, error: errors.tooBig(toMb(size), kind, maxMb(kind)) };
  }

  const int = (n?: number) => (Number.isFinite(n) && n! > 0 ? Math.round(n!) : null);
  const db = createAdminClient();
  const { data: row, error } = await db.from("uploads").insert({
    event_id: event.id,
    guest_name: guestName,
    guest_token: input.guestToken,
    r2_key: input.key,
    file_type: kind,
    mime_type: input.mime,
    size_bytes: size,
    width: int(input.width),
    height: int(input.height),
    duration_seconds: (kind === "video" || kind === "audio") && input.durationSeconds ? Math.min(input.durationSeconds, 9999) : null,
  }).select("id").single();

  if (row) return { ok: true, id: row.id };
  // 23505 = already saved (e.g. the confirm was retried) — look up the existing row.
  if (error?.code === "23505") {
    const { data: existing } = await db.from("uploads").select("id").eq("r2_key", input.key).single();
    if (existing) return { ok: true, id: existing.id };
  }
  console.error("confirmGuestUpload failed:", error?.code, error?.message);
  return { ok: false, error: errors.failed };
}

// A guest can delete their own files (matched by the id stored in their browser).
export async function deleteMyUpload(
  slug: string,
  input: { uploadId: string; guestToken: string; pin: string },
): Promise<ActionResult> {
  const errors = (await getT()).guest.errors;
  if (!(await rateLimit("delete", 100))) return { ok: false, error: errors.rateLimit };
  if (!UUID.test(input.guestToken) || !UUID.test(input.uploadId)) return { ok: false, error: errors.deleteFailed };

  const db = createAdminClient();
  const { data: event } = await db.from("events").select("id, pin_hash").eq("slug", slug).maybeSingle();
  if (!event) return { ok: false, error: errors.deleteFailed };
  if (!(await eventPinOk(event.pin_hash, input.pin))) return { ok: false, error: errors.wrongPin };

  const { data: deleted } = await db
    .from("uploads")
    .delete()
    .eq("id", input.uploadId)
    .eq("event_id", event.id)
    .eq("guest_token", input.guestToken)
    .select("r2_key")
    .maybeSingle();
  if (!deleted) return { ok: false, error: errors.deleteFailed };

  await deleteObject(deleted.r2_key).catch((e) => console.error("R2 delete failed:", e));
  return { ok: true };
}

// ─── Guest gallery (only when the host allows it) ───────────────────────────

export type GuestGalleryItem = {
  id: string;
  kind: FileKind;
  guestName: string;
  createdAt: string;
  url: string;
  downloadUrl: string;
  fileName: string;
  mine: boolean;
};

export async function listGuestGallery(
  slug: string,
  pin: string,
  guestToken?: string,
): Promise<ActionResult<{ items: GuestGalleryItem[] }>> {
  const t = await getT();
  const errors = t.guest.errors;
  if (!(await rateLimit("gallery", 120))) return { ok: false, error: errors.rateLimit };

  const db = createAdminClient();
  const { data: event } = await db
    .from("events")
    .select("id, slug, guests_can_view, pin_hash")
    .eq("slug", slug)
    .maybeSingle();
  if (!event?.guests_can_view) return { ok: false, error: t.guest.galleryClosed };
  if (!(await eventPinOk(event.pin_hash, pin))) return { ok: false, error: errors.wrongPin };

  const { data: uploads } = await db
    .from("uploads")
    .select("id, guest_name, guest_token, r2_key, file_type, mime_type, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = uploads ?? [];
  const items = await Promise.all(
    rows.map(async (u, i) => {
      const name = mediaFileName([event.slug, rows.length - i], u.mime_type);
      const { url, downloadUrl } = await signMedia(u.r2_key, name);
      const mine = Boolean(guestToken) && u.guest_token === guestToken;
      return { id: u.id, kind: u.file_type, guestName: u.guest_name, createdAt: u.created_at, url, downloadUrl, fileName: name, mine };
    }),
  );
  return { ok: true, items };
}
