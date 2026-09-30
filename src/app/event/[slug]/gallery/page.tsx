import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { GuestGallery } from "@/components/guest/guest-gallery";
import { GuestNotice, GuestShell } from "@/components/guest/guest-shell";
import { getPublicEvent } from "@/lib/public-event";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/event/[slug]/gallery">): Promise<Metadata> {
  const { slug } = await params;
  const [event, t] = await Promise.all([getPublicEvent(slug), getT()]);
  return { title: event ? `${t.guest.galleryTitle} · ${event.title}` : t.guest.notFoundTitle, robots: { index: false } };
}

// Gallery for guests — only exists when the host turned on "Gosti vide galeriju".
export default async function GuestGalleryPage({ params }: PageProps<"/event/[slug]/gallery">) {
  const { slug } = await params;
  const [event, t] = await Promise.all([getPublicEvent(slug), getT()]);
  if (!event) notFound();

  return (
    <GuestShell event={event} enter="slide-in-from-bottom-4 fade-in" className="gap-8">
      <div className="mx-auto w-full max-w-6xl text-center">
        <p className="font-semibold tracking-[0.2em] uppercase">{t.guest.galleryTitle}</p>
        <h1 className="mt-1 font-serif text-5xl leading-tight">{event.title}</h1>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        {event.guests_can_view ? (
          <GuestGallery slug={event.slug} hasPin={event.has_pin} />
        ) : (
          <GuestNotice icon={<Lock aria-hidden />} title={t.guest.galleryClosed} text={t.guest.galleryClosedText} />
        )}
      </div>
    </GuestShell>
  );
}
