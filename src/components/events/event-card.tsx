import Link from "next/link";
import { CalendarDays, Images, Settings } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatEventDate, monogram, type EventRow } from "@/lib/events";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n/server";

export async function EventCard({ event }: { event: EventRow }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const [first, second] = monogram(event.title);
  const date = formatEventDate(event.event_date, intlLocale[locale]);

  return (
    <article className="flex items-center gap-4 rounded-[1.75rem] bg-card p-4 shadow-sm sm:p-5">
      <div className="grid size-16 shrink-0 place-items-center rounded-full bg-lilac font-serif text-2xl text-ink sm:size-20 sm:text-3xl">
        <span>
          {first}
          {second && (
            <>
              <span className="text-primary">&amp;</span>
              {second}
            </>
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t.eventTypeLabels[event.event_type]}
        </p>
        <h2 className="truncate font-heading text-xl font-bold sm:text-2xl">
          <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
            {event.title}
          </Link>
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {date && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden />
              {date}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              event.uploads_open ? "bg-blaze/15 text-primary" : "bg-muted text-muted-foreground",
            )}
          >
            <span className={cn("size-1.5 rounded-full", event.uploads_open ? "bg-primary" : "bg-muted-foreground")} />
            {event.uploads_open ? t.dashboard.uploadsOpen : t.dashboard.uploadsClosed}
          </span>
        </div>
        <Link
          href={`/event/${event.slug}`}
          className="mt-2 inline-block truncate text-sm font-semibold underline decoration-lilac decoration-2 underline-offset-4"
        >
          /event/{event.slug}
        </Link>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <Link
          href={`/dashboard/events/${event.id}/gallery`}
          aria-label={t.gallery.open}
          className={cn(buttonVariants({ size: "icon-lg" }), "sm:w-auto sm:px-4")}
        >
          <Images aria-hidden />
          <span className="hidden sm:inline">{t.gallery.open}</span>
        </Link>
        <Link
          href={`/dashboard/events/${event.id}`}
          aria-label={t.settings.open}
          className={cn(buttonVariants({ variant: "outline", size: "icon-lg" }), "sm:w-auto sm:px-4")}
        >
          <Settings aria-hidden />
          <span className="hidden sm:inline">{t.settings.open}</span>
        </Link>
      </div>
    </article>
  );
}
