import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

// Frame for the marketing/legal pages (How it works, Pricing, FAQ, Privacy,
// Terms): a logo header, scrollable content, and the shared footer — unlike
// SiteShell, which is one fixed-height hero panel.
// `wide` widens the content for pages with side-by-side cards (e.g. pricing);
// the default article width keeps text pages comfortable to read.
export function MarketingShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
          {t.nav.login}
        </Link>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-8 px-4 pt-6 pb-12 sm:px-6 sm:pt-10",
          wide ? "max-w-6xl" : "max-w-3xl",
        )}
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
