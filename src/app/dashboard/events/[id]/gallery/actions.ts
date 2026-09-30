"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { deleteObject } from "@/lib/r2";
import type { ActionResult } from "@/lib/result";
import { getT } from "@/lib/i18n/server";

export async function deleteUpload(eventId: string, uploadId: string): Promise<ActionResult> {
  const t = await getT();
  const { supabase } = await requireUser(`/dashboard/events/${eventId}/gallery`);

  // RLS: the row comes back (and can be deleted) only if the event is yours.
  const { data: upload } = await supabase
    .from("uploads")
    .select("id, r2_key")
    .eq("id", uploadId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!upload) return { ok: false, error: t.gallery.deleteFailed };

  const { error } = await supabase.from("uploads").delete().eq("id", upload.id);
  if (error) {
    console.error("deleteUpload failed:", error.code, error.message);
    return { ok: false, error: t.gallery.deleteFailed };
  }
  await deleteObject(upload.r2_key).catch((e) => console.error("R2 delete failed:", e));

  revalidatePath(`/dashboard/events/${eventId}/gallery`);
  return { ok: true };
}
