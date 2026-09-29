"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { mediaFileName, signMedia } from "@/lib/media";

export type SlideshowItem = { id: string; kind: "image" | "video"; url: string; guestName: string };

// Public (no login, no PIN) — meant to run unattended on a TV/projector.
// Premium-only, enforced here too, not just at the page that links to it.
export async function getSlideshowItems(eventId: string): Promise<SlideshowItem[]> {
  const db = createAdminClient();
  const { data: event } = await db.from("events").select("plan").eq("id", eventId).maybeSingle();
  if (event?.plan !== "deluxe") return [];

  const { data } = await db
    .from("uploads")
    .select("id, r2_key, file_type, mime_type, guest_name, created_at")
    .eq("event_id", eventId)
    .in("file_type", ["image", "video"])
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (u) => {
      const { url } = await signMedia(u.r2_key, mediaFileName([u.guest_name], u.mime_type));
      return { id: u.id, kind: u.file_type as "image" | "video", url, guestName: u.guest_name };
    }),
  );
}
