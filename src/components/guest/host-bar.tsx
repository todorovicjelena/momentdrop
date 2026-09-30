import Link from "next/link";
import { Images, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

// Shown on guest pages only to the event's owner, as a shortcut back to the dashboard.
export async function HostBar({ slug }: { slug: string }) {
  const t = await getT();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return null;

  // RLS: returns the row only if the logged-in user owns this event.
  const { data: event } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
  if (!event) return null;

  const base = `/dashboard/events/${event.id}`;
  const link = "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold hover:bg-cream/15";
  return (
    <div className="w-full bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-sm">
        <span className="opacity-80">{t.guest.hostBar}</span>
        <Link href={base} className={link}>
          <Settings className="size-4" aria-hidden />
          {t.settings.open}
        </Link>
        <Link href={`${base}/gallery`} className={link}>
          <Images className="size-4" aria-hidden />
          {t.gallery.open}
        </Link>
      </div>
    </div>
  );
}
