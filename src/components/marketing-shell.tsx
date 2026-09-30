import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { LanguageToggle } from "@/components/language-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

// Frame for the legal pages (Privacy, Terms): a logo header, scrollable
// article-width content, and the shared footer — unlike SiteShell, which is
// one fixed-height hero panel. How it works, Pricing and FAQ live as
// sections on the home page instead of their own routes.
export async function MarketingShell({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            {t.nav.login}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-6 pb-12 sm:px-6 sm:pt-10">{children}</main>

      <SiteFooter />
    </div>
  );
}
