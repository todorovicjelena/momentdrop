import { Swirls } from "@/components/swirls";
import { GuestTabs } from "@/components/guest/guest-tabs";
import { HostBar } from "@/components/guest/host-bar";
import type { PublicEvent } from "@/lib/public-event";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

// Frame shared by all guest pages: host shortcut bar, the event's color,
// swirl (or, on paid plans, a custom) background, "Pošalji · Galerija" tabs
// and the brand footer.
export async function GuestShell({
  event,
  className,
  enter = "fade-in",
  children,
}: {
  event: Pick<PublicEvent, "slug" | "primary_color" | "guests_can_view" | "background_url">;
  className?: string;
  // How the content animates in. The swirl background stays put, so only the
  // content moves — no flash of the page behind it. Pošalji slides in from the
  // left, Galerija from the right, so switching tabs reads as left↔right.
  enter?: string;
  children: React.ReactNode;
}) {
  const t = await getT();
  return (
    <>
      <HostBar slug={event.slug} />
      <main
        className="relative isolate flex flex-1 flex-col overflow-hidden px-4 pt-10 pb-10 text-cream"
        // The host's color replaces the orange accents on guest pages.
        style={{ "--color-blaze": event.primary_color, "--primary": event.primary_color } as React.CSSProperties}
      >
        {event.background_url ? (
          // Paid plans can replace the MomentDrop swirl look with their own image.
          // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
          <img src={event.background_url} alt="" aria-hidden className="absolute inset-0 -z-10 size-full object-cover" />
        ) : (
          <Swirls />
        )}
        <div className={cn("flex flex-1 flex-col animate-in duration-500 ease-out", enter, className)}>
          {event.guests_can_view && <GuestTabs slug={event.slug} />}
          {children}
          <p className="mt-auto pt-10 text-center font-serif text-xl">
            {t.app.name}
            <span className="text-blaze">.</span>
          </p>
        </div>
      </main>
    </>
  );
}

// Small cream card with an icon, e.g. "Upload je zatvoren".
export function GuestNotice({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-lilac-soft px-4 py-3 text-left text-ink [&>svg]:size-6 [&>svg]:shrink-0 [&>svg]:text-primary">
      {icon}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
