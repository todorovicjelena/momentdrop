import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { Plan } from "@/lib/plans";
import type { EventType } from "@/lib/events";

// The logged-in user's event (RLS hides everyone else's → 404).
// cache(): the event layout and its pages share one query per request.
export const getOwnedEvent = cache(async (id: string) => {
  const { supabase } = await requireUser(`/dashboard/events/${id}`);
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, plan, event_type")
    .eq("id", id)
    .maybeSingle<{ id: string; slug: string; title: string; plan: Plan; event_type: EventType }>();
  if (!event) notFound();
  return { supabase, event };
});
