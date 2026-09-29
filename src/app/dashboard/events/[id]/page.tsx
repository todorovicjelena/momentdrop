import type { Metadata } from "next";
import { getOwnedEvent } from "@/lib/owned-event";
import { presignGet } from "@/lib/r2";
import { isoToLocalInput, type EventSettings } from "@/lib/events";
import { SettingsForm } from "@/components/events/settings-form";
import { PlanCard } from "@/components/events/plan-card";
import { PageTransition } from "@/components/page-transition";
import type { Plan } from "@/lib/plans";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t.settings.title };

// Title, tabs and guest link come from ./layout.tsx.
export default async function EventSettingsPage({ params }: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const { supabase } = await getOwnedEvent(id);

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, slug, title, event_type, event_date, welcome_message, logo_key, cover_key, background_key, primary_color, uploads_open, upload_deadline, pin_hash, guests_can_view, created_at, plan, storage_expires_at",
    )
    .eq("id", id)
    .single<EventSettings & { plan: Plan; storage_expires_at: string | null }>();
  if (!event) return null; // layout already 404s for events you don't own

  const { count: uploadCount } = await supabase
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);

  const [logoUrl, coverUrl, backgroundUrl] = await Promise.all([
    event.logo_key ? presignGet(event.logo_key) : null,
    event.cover_key ? presignGet(event.cover_key) : null,
    event.background_key ? presignGet(event.background_key) : null,
  ]);

  return (
    <PageTransition>
    <main className="flex w-full max-w-2xl flex-col gap-6">
      <PlanCard eventId={event.id} plan={event.plan} uploadCount={uploadCount ?? 0} storageExpiresAt={event.storage_expires_at} />
      <SettingsForm
        event={{
          id: event.id,
          title: event.title,
          event_type: event.event_type,
          event_date: event.event_date,
          welcome_message: event.welcome_message,
          primary_color: event.primary_color,
          uploads_open: event.uploads_open,
          deadline_local: isoToLocalInput(event.upload_deadline),
          has_pin: Boolean(event.pin_hash),
          guests_can_view: event.guests_can_view,
          logo_url: logoUrl,
          cover_url: coverUrl,
          plan: event.plan,
          background_url: backgroundUrl,
        }}
      />
    </main>
    </PageTransition>
  );
}
