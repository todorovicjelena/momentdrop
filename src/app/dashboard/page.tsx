import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, displayName } from "@/lib/auth";
import { EventCard } from "@/components/events/event-card";
import { PageTransition } from "@/components/page-transition";
import { DancingFlowers } from "@/components/dancing-flowers";
import { buttonVariants } from "@/components/ui/button";
import type { EventRow } from "@/lib/events";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).dashboard.title };
}

export default async function DashboardPage() {
  const t = await getT();
  const { supabase, claims } = await requireUser("/dashboard");

  // RLS returns only this user's events.
  const { data: events, error } = await supabase
    .from("events")
    .select("id, slug, title, event_type, event_date, uploads_open, created_at")
    .order("created_at", { ascending: false })
    .overrideTypes<EventRow[], { merge: false }>();
  if (error) console.error("Loading events failed:", error.code, error.message);

  const hasEvents = Boolean(events?.length);
  const newEventLink = (
    <Link href="/dashboard/new" className={buttonVariants({ size: "lg" })}>
      <Plus aria-hidden />
      {t.dashboard.newEvent}
    </Link>
  );

  return (
    <PageTransition>
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground">{t.dashboard.greeting(displayName(claims))}</p>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">{t.dashboard.title}</h1>
        </div>
        {hasEvents && newEventLink}
      </div>

      {hasEvents ? (
        <div className="flex flex-col gap-3">
          {events!.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-card px-6 py-12 text-center shadow-sm">
          <DancingFlowers className="w-56 sm:w-64" />
          <p className="font-heading text-2xl font-bold">{t.dashboard.empty}</p>
          <p className="max-w-sm text-muted-foreground">{t.dashboard.emptyHint}</p>
          {newEventLink}
        </div>
      )}
    </main>
    </PageTransition>
  );
}
