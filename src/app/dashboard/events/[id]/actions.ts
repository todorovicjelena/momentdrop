"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { hashPin, PIN_PATTERN } from "@/lib/pin";
import { deleteObject, objectSize, presignGet, presignPut } from "@/lib/r2";
import {
  BRANDING,
  brandingKeyPrefix,
  COLOR_PATTERN,
  EVENT_TYPES,
  localInputToIso,
  type BrandingKind,
  type EventType,
} from "@/lib/events";
import { createCheckout } from "@/lib/lemonsqueezy";
import { getOrigin } from "@/lib/origin";
import { PLAN_LIMITS, type PaidPlan } from "@/lib/plans";
import type { ActionResult } from "@/lib/result";
import { t } from "@/lib/i18n";

const errors = t.settings.errors;

export type SettingsState = { error?: string; saved?: boolean } | undefined;

// ─── Event settings form ────────────────────────────────────────────────────

export async function updateEvent(eventId: string, _prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireUser(`/dashboard/events/${eventId}`);

  // RLS: returns the row only if it belongs to the current user.
  const { data: current } = await supabase.from("events").select("slug, pin_hash").eq("id", eventId).maybeSingle();
  if (!current) return { error: errors.notFound };

  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const title = text("title");
  const eventType = text("event_type") as EventType;
  const welcome = text("welcome_message");
  const color = text("primary_color");
  const deadlineLocal = text("upload_deadline"); // Belgrade wall-clock time, "YYYY-MM-DDTHH:mm" or ""
  const deadline = deadlineLocal ? localInputToIso(deadlineLocal) : null;
  const pinEnabled = formData.get("pin_enabled") === "on";
  const pin = text("pin");

  if (!title || title.length > 120) return { error: t.newEvent.errors.titleRequired };
  if (!EVENT_TYPES.includes(eventType)) return { error: t.newEvent.errors.invalidType };
  if (welcome.length > 1000) return { error: errors.welcomeTooLong };
  if (!COLOR_PATTERN.test(color)) return { error: errors.invalidColor };
  if (deadlineLocal && !deadline) return { error: errors.invalidDeadline };

  // PIN: off → remove; on + new value → replace; on + empty → keep existing (or require one).
  let pinHash = current.pin_hash as string | null;
  if (!pinEnabled) pinHash = null;
  else if (pin) {
    if (!PIN_PATTERN.test(pin)) return { error: errors.invalidPin };
    pinHash = await hashPin(pin);
  } else if (!pinHash) return { error: errors.pinRequired };

  const { error } = await supabase
    .from("events")
    .update({
      title,
      event_type: eventType,
      event_date: text("event_date") || null,
      welcome_message: welcome || null,
      primary_color: color.toLowerCase(),
      uploads_open: formData.get("uploads_open") === "on",
      upload_deadline: deadline,
      guests_can_view: formData.get("guests_can_view") === "on",
      pin_hash: pinHash,
    })
    .eq("id", eventId);

  if (error) {
    console.error("updateEvent failed:", error.code, error.message);
    return { error: t.newEvent.errors.generic };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/event/${current.slug}`);
  return { saved: true };
}

// ─── Logo & cover (browser uploads straight to R2) ──────────────────────────

async function ownedEvent(eventId: string) {
  const { supabase } = await requireUser(`/dashboard/events/${eventId}`);
  const { data } = await supabase.from("events").select("id, slug, plan, logo_key, cover_key, background_key").eq("id", eventId).maybeSingle();
  return { supabase, event: data };
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const BRANDING_COLUMN: Record<BrandingKind, "logo_key" | "cover_key" | "background_key"> = {
  logo: "logo_key",
  cover: "cover_key",
  background: "background_key",
};

// Step 1: validate and hand the browser a one-time upload URL.
export async function presignBrandingUpload(
  eventId: string,
  kind: BrandingKind,
  contentType: string,
  size: number,
): Promise<ActionResult<{ url: string; key: string }>> {
  const { event } = await ownedEvent(eventId);
  if (!event) return { ok: false, error: errors.notFound };
  if (!BRANDING.kinds.includes(kind)) return { ok: false, error: errors.uploadFailed };
  if ((BRANDING.paidOnly as readonly string[]).includes(kind) && event.plan === "free") {
    return { ok: false, error: errors.paidPlanRequired };
  }
  if (!(BRANDING.mimeTypes as readonly string[]).includes(contentType)) return { ok: false, error: errors.imageType };
  if (!Number.isInteger(size) || size <= 0 || size > BRANDING.maxBytes) return { ok: false, error: errors.imageSize };

  const key = `${brandingKeyPrefix(eventId)}${kind}-${randomUUID()}.${EXT[contentType]}`;
  return { ok: true, key, url: await presignPut(key, contentType, size) };
}

// Step 2: after the browser uploaded, check the file really is there and save it.
export async function saveBrandingImage(
  eventId: string,
  kind: BrandingKind,
  key: string,
): Promise<ActionResult<{ previewUrl: string }>> {
  const { supabase, event } = await ownedEvent(eventId);
  if (!event) return { ok: false, error: errors.notFound };
  if (!key.startsWith(`${brandingKeyPrefix(eventId)}${kind}-`)) return { ok: false, error: errors.uploadFailed };

  const size = await objectSize(key);
  if (size === null) return { ok: false, error: errors.uploadFailed };
  if (size > BRANDING.maxBytes) {
    await deleteObject(key);
    return { ok: false, error: errors.imageSize };
  }

  const column = BRANDING_COLUMN[kind];
  const { error } = await supabase.from("events").update({ [column]: key }).eq("id", eventId);
  if (error) {
    console.error("saveBrandingImage failed:", error.code, error.message);
    return { ok: false, error: errors.uploadFailed };
  }

  const old = event[column];
  if (old && old !== key) await deleteObject(old).catch(() => {});

  revalidatePath(`/event/${event.slug}`);
  return { ok: true, previewUrl: await presignGet(key) };
}

export async function removeBrandingImage(eventId: string, kind: BrandingKind): Promise<ActionResult> {
  const { supabase, event } = await ownedEvent(eventId);
  if (!event) return { ok: false, error: errors.notFound };

  const column = BRANDING_COLUMN[kind];
  const old = event[column];
  const { error } = await supabase.from("events").update({ [column]: null }).eq("id", eventId);
  if (error) return { ok: false, error: errors.uploadFailed };
  if (old) await deleteObject(old).catch(() => {});

  revalidatePath(`/event/${event.slug}`);
  return { ok: true };
}

// ─── Premium upgrade (Lemon Squeezy) ────────────────────────────────────────

// Starts a one-time-payment checkout for upgrading this event to the given
// paid plan. The event's plan flips once Lemon Squeezy confirms payment via
// webhook — see src/app/api/lemonsqueezy/webhook/route.ts.
export async function createUpgradeCheckout(eventId: string, plan: PaidPlan): Promise<ActionResult<{ url: string }>> {
  const { supabase } = await requireUser(`/dashboard/events/${eventId}`);
  const { data: event } = await supabase.from("events").select("id, plan").eq("id", eventId).maybeSingle();
  if (!event) return { ok: false, error: errors.notFound };
  // Already at or above this plan (ranked by how much it includes) — nothing to buy.
  if (PLAN_LIMITS[event.plan as keyof typeof PLAN_LIMITS].storageDays >= PLAN_LIMITS[plan].storageDays) {
    return { ok: false, error: errors.checkoutFailed };
  }

  const redirectUrl = `${await getOrigin()}/dashboard/events/${eventId}?upgraded=1`;
  const url = await createCheckout(eventId, plan, redirectUrl);
  if (!url) return { ok: false, error: errors.checkoutFailed };
  return { ok: true, url };
}
