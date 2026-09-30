import { ImagePlus, Images } from "lucide-react";
import { NavTabs } from "@/components/nav-tabs";
import { getT } from "@/lib/i18n/server";

// "Pošalji · Galerija" for guests — only rendered when the host allows the gallery.
export async function GuestTabs({ slug }: { slug: string }) {
  const t = await getT();
  return (
    <NavTabs
      className="mx-auto"
      tabs={[
        { href: `/event/${slug}`, label: t.guest.sendTab, icon: <ImagePlus aria-hidden /> },
        { href: `/event/${slug}/gallery`, label: t.guest.galleryTitle, icon: <Images aria-hidden /> },
      ]}
    />
  );
}
