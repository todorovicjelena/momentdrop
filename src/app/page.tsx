import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { SiteFooter } from "@/components/site-footer";
import { DancingFlowers } from "@/components/dancing-flowers";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export default function Home() {
  return (
    <>
    <SiteShell
      headerRight={
        <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
          {t.nav.login}
        </Link>
      }
      panelClassName="px-6 pt-10 pb-8 text-cream sm:px-12 sm:pt-14"
    >
      <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Hero text and art rise in one after another over the fixed swirl panel. */}
        <div className="animate-in duration-700 fade-in slide-in-from-bottom-5 ease-out">
          <p className="font-semibold tracking-wide">{t.app.kicker}</p>
          <h1 className="mt-4 font-serif text-[3.25rem] leading-[0.95] sm:text-8xl">
            {t.app.headline[0]}
            <br />
            {t.app.headline[1]}
          </h1>
          <p className="mt-6 max-w-md rounded-2xl bg-cream/90 px-4 py-3 text-lg leading-snug font-medium text-ink">
            {t.app.description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "shadow-lg shadow-primary/30")}>
              {t.nav.signup}
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-0 bg-cream text-ink hover:bg-white")}
            >
              {t.nav.login}
            </Link>
          </div>
        </div>

        <DancingFlowers
          priority
          className="mx-auto max-w-md animate-in fill-mode-backwards duration-700 fade-in zoom-in-95 ease-out [animation-delay:180ms]"
        />
      </div>

      <p className="mt-8 animate-in fill-mode-backwards text-center font-heading text-2xl font-extrabold tracking-tight uppercase duration-500 fade-in [animation-delay:360ms]">
        {t.app.footerLine}
      </p>
    </SiteShell>
    <SiteFooter />
    </>
  );
}
