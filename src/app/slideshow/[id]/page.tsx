import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SlideshowPlayer } from "@/components/slideshow-player";
import { t } from "@/lib/i18n";

// Public — no login, no PIN. Meant to be opened once on a TV/projector and
// left running; access itself is gated to Premium in getSlideshowItems too.
export default async function SlideshowPage({ params }: PageProps<"/slideshow/[id]">) {
  const { id } = await params;
  const { data: event } = await createAdminClient().from("events").select("id, title, plan").eq("id", id).maybeSingle();
  if (!event) notFound();

  if (event.plan !== "deluxe") {
    return (
      <main className="grid min-h-dvh place-items-center bg-ink px-6 text-center text-cream">
        <div>
          <p className="font-serif text-3xl">{t.slideshow.lockedTitle}</p>
          <p className="mt-2 text-cream/70">{t.slideshow.lockedText}</p>
        </div>
      </main>
    );
  }

  return <SlideshowPlayer eventId={event.id} title={event.title} />;
}
