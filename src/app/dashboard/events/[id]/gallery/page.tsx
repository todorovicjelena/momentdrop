import type { Metadata } from "next";
import Link from "next/link";
import { getOwnedEvent } from "@/lib/owned-event";
import { mediaFileName, signMedia } from "@/lib/media";
import { slugify } from "@/lib/events";
import type { FileKind } from "@/lib/uploads";
import { GalleryGrid, type GalleryItem } from "@/components/gallery/gallery-grid";
import { PageTransition } from "@/components/page-transition";
import { deleteUpload } from "./actions";
import { DancingFlowers } from "@/components/dancing-flowers";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).gallery.title };
}

type UploadRow = {
  id: string;
  guest_name: string;
  r2_key: string;
  file_type: FileKind;
  mime_type: string;
  created_at: string;
};

const FILTERS = ["all", "image", "video", "audio"] as const;
type Filter = (typeof FILTERS)[number];
const ZIP_SUFFIX: Record<Filter, string> = { all: "", image: "-photos", video: "-video", audio: "-audio" };

export default async function GalleryPage({ params, searchParams }: PageProps<"/dashboard/events/[id]/gallery">) {
  const t = await getT();
  const { id } = await params;
  const { type } = await searchParams;
  const filter: Filter = type === "image" || type === "video" || type === "audio" ? type : "all";
  const { supabase, event } = await getOwnedEvent(id);

  // RLS: only uploads of your own events come back.
  const { data: uploads } = await supabase
    .from("uploads")
    .select("id, guest_name, r2_key, file_type, mime_type, created_at")
    .eq("event_id", id)
    .order("created_at", { ascending: false })
    .overrideTypes<UploadRow[], { merge: false }>();

  const all = uploads ?? [];
  const counts = {
    all: all.length,
    image: all.filter((u) => u.file_type === "image").length,
    video: all.filter((u) => u.file_type === "video").length,
    audio: all.filter((u) => u.file_type === "audio").length,
  };
  const shown = filter === "all" ? all : all.filter((u) => u.file_type === filter);

  // Short-lived signed links: one to view, one that downloads with a readable name.
  const items: GalleryItem[] = await Promise.all(
    shown.map(async (u, i) => {
      const name = mediaFileName([event.slug, slugify(u.guest_name) || "guest", shown.length - i], u.mime_type);
      const { url, downloadUrl } = await signMedia(u.r2_key, name);
      return {
        id: u.id,
        kind: u.file_type,
        guestName: u.guest_name,
        createdAt: u.created_at,
        url,
        downloadUrl,
        fileName: name,
        canDelete: true,
      };
    }),
  );

  return (
    <PageTransition>
    <main className="flex w-full flex-col gap-5">
      <nav className="flex flex-wrap gap-2" aria-label={t.gallery.title}>
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "?" : `?type=${f}`}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-semibold transition-colors",
              filter === f ? "bg-ink text-cream" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {t.gallery.filters[f]} <span className="opacity-70">{counts[f]}</span>
          </Link>
        ))}
      </nav>

      {items.length > 0 ? (
        <GalleryGrid items={items} onDelete={deleteUpload.bind(null, event.id)} zipName={`${event.slug}${ZIP_SUFFIX[filter]}.zip`} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-card px-6 py-12 text-center shadow-sm">
          <DancingFlowers className="w-48" />
          <p className="font-heading text-2xl font-bold">{t.gallery.empty[filter]}</p>
          <p className="max-w-sm text-muted-foreground">{t.gallery.emptyHint[filter]}</p>
        </div>
      )}
    </main>
    </PageTransition>
  );
}
