"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_TYPES, SLUG_PATTERN, type EventType } from "@/lib/events";
import { storageExpiresAt } from "@/lib/plans";
import { getT } from "@/lib/i18n/server";

export type CreateEventState = { error?: string; field?: "title" | "slug" | "type"; suggestion?: string } | undefined;

const isValidSlug = (slug: string) => SLUG_PATTERN.test(slug) && slug.length >= 3 && slug.length <= 60;

// Links are unique across ALL hosts, so this checks with the admin client (RLS
// would only show your own events). Returns only yes/no + a free alternative.
async function freeSlugSuggestion(slug: string) {
  const { data } = await createAdminClient().from("events").select("slug").like("slug", `${slug}%`).limit(200);
  const taken = new Set((data ?? []).map((row) => row.slug));
  if (!taken.has(slug)) return null;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${slug.slice(0, 55)}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${slug.slice(0, 50)}-${Date.now().toString(36)}`;
}

export type SlugCheck = { status: "free" } | { status: "taken"; suggestion: string } | { status: "invalid" };

export async function checkSlug(slug: string): Promise<SlugCheck> {
  await requireUser("/dashboard/new");
  const clean = slug.trim().toLowerCase();
  if (!isValidSlug(clean)) return { status: "invalid" };
  const suggestion = await freeSlugSuggestion(clean);
  return suggestion ? { status: "taken", suggestion } : { status: "free" };
}

export async function createEvent(_prev: CreateEventState, formData: FormData): Promise<CreateEventState> {
  const errors = (await getT()).newEvent.errors;
  const { supabase } = await requireUser("/dashboard/new");

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const eventType = String(formData.get("event_type") ?? "") as EventType;
  const eventDate = String(formData.get("event_date") ?? "") || null;

  if (!title || title.length > 120) return { error: errors.titleRequired, field: "title" };
  if (!EVENT_TYPES.includes(eventType)) return { error: errors.invalidType, field: "type" };
  if (!isValidSlug(slug)) {
    return { error: errors.invalidSlug, field: "slug" };
  }

  // owner_id defaults to auth.uid() in the database; RLS makes sure it's you.
  const { data: created, error } = await supabase
    .from("events")
    .insert({ title, slug, event_type: eventType, event_date: eventDate, storage_expires_at: storageExpiresAt("free").toISOString() })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      // unique violation — someone already uses this link
      const suggestion = (await freeSlugSuggestion(slug)) ?? undefined;
      return { error: errors.slugTaken, field: "slug", suggestion };
    }
    console.error("createEvent failed:", error.code, error.message);
    return { error: errors.generic };
  }

  revalidatePath("/dashboard");
  // Straight to settings: message, logo, cover, PIN…
  redirect(`/dashboard/events/${created.id}`);
}
