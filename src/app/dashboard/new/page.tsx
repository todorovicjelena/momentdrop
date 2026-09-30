import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getOrigin } from "@/lib/origin";
import { EventForm } from "@/components/events/event-form";
import { PageTransition } from "@/components/page-transition";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).newEvent.title };
}

export default async function NewEventPage() {
  const t = await getT();
  await requireUser("/dashboard/new");
  const host = (await getOrigin()).replace(/^https?:\/\//, "");

  return (
    <PageTransition>
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">{t.newEvent.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.newEvent.subtitle}</p>
      </div>
      <div className="rounded-[2rem] bg-card p-5 shadow-sm sm:p-8">
        <EventForm linkPrefix={`${host}/event/`} />
      </div>
    </main>
    </PageTransition>
  );
}
