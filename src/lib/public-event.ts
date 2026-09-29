import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { presignGet } from "@/lib/r2";
import type { EventType } from "@/lib/events";

// What a guest may see about an event. Never include owner_id or pin_hash here.
export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  welcome_message: string | null;
  primary_color: string;
  uploads_open: boolean;
  upload_deadline: string | null;
  storage_expires_at: string | null;
  guests_can_view: boolean;
  has_pin: boolean;
  logo_url: string | null;
  cover_url: string | null;
  // Set only on paid plans — replaces the default swirl decoration, see GuestShell.
  background_url: string | null;
};

// cache(): page and generateMetadata share one query per request.
export const getPublicEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  const { data, error } = await createAdminClient()
    .from("events")
    .select(
      "id, slug, title, event_type, event_date, welcome_message, primary_color, uploads_open, upload_deadline, storage_expires_at, guests_can_view, pin_hash, logo_key, cover_key, background_key",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getPublicEvent failed:", error.code, error.message);
    return null;
  }
  if (!data) return null;

  const { pin_hash, logo_key, cover_key, background_key, ...rest } = data;
  const [logo_url, cover_url, background_url] = await Promise.all([
    logo_key ? presignGet(logo_key) : null,
    cover_key ? presignGet(cover_key) : null,
    background_key ? presignGet(background_key) : null,
  ]);
  return { ...rest, has_pin: Boolean(pin_hash), logo_url, cover_url, background_url } as PublicEvent;
});
