/* eslint-disable @next/next/no-img-element -- presigned R2 URLs, not optimizable by next/image */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Lock } from "lucide-react";
import { DancingFlowers } from "@/components/dancing-flowers";
import { GuestUploader } from "@/components/guest/guest-uploader";
import { GuestNotice, GuestShell } from "@/components/guest/guest-shell";
import { getPublicEvent } from "@/lib/public-event";
import { formatEventDate, isUploadClosed } from "@/lib/events";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/event/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  return { title: event?.title ?? t.guest.notFoundTitle, robots: { index: false } };
}

// Guest page (no account needed): event branding + photo/video upload.
export default async function GuestEventPage({ params }: PageProps<"/event/[slug]">) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const date = formatEventDate(event.event_date);

  return (
    <GuestShell event={event} enter="slide-in-from-bottom-4 fade-in" className="items-center px-5 text-center">
      {event.cover_url && (
        <img src={event.cover_url} alt="" className="mt-6 mb-8 aspect-[5/2] w-full max-w-xl rounded-[2rem] object-cover shadow-xl" />
      )}

      {event.logo_url && (
        <img
          src={event.logo_url}
          alt=""
          className={`size-24 rounded-full border-4 border-cream object-cover shadow-lg ${event.cover_url ? "-mt-20" : "mt-6"}`}
        />
      )}

      <p className="mt-4 text-sm font-semibold tracking-[0.2em] uppercase">{t.eventTypeLabels[event.event_type]}</p>
      <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[0.95] sm:text-7xl">{event.title}</h1>
      {date && (
        <p className="mt-4 inline-flex items-center gap-2 font-semibold">
          <CalendarDays className="size-4" aria-hidden />
          {date}
        </p>
      )}

      {!event.cover_url && <DancingFlowers priority className="my-8 max-w-xs" />}

      <div className="mt-8 w-full max-w-md rounded-[1.75rem] bg-cream p-6 text-ink shadow-xl">
        <p className="text-lg leading-snug whitespace-pre-line">
          {event.welcome_message || t.guest.defaultWelcome[event.event_type]}
        </p>
        <div className="mt-5 border-t border-border pt-5">
          {isUploadClosed(event) ? (
            <GuestNotice icon={<Lock aria-hidden />} title={t.guest.closedTitle} text={t.guest.closedText} />
          ) : (
            <GuestUploader slug={event.slug} hasPin={event.has_pin} guestsCanView={event.guests_can_view} plan={event.plan} />
          )}
        </div>
      </div>
    </GuestShell>
  );
}
