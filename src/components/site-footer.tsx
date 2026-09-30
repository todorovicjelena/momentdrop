import Link from "next/link";
import { Logo } from "@/components/logo";
import { getT } from "@/lib/i18n/server";

// Link list shared by the home page and every marketing/legal page.
export async function SiteFooter() {
  const nav = (await getT()).marketing.nav;
  return (
    <footer className="mx-auto mt-8 w-full max-w-6xl px-4 pb-8">
      <div className="flex flex-col gap-6 rounded-[2rem] bg-card px-6 py-8 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:px-10">
        <Logo className="text-xl" />
        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
          <FooterLink href="/#kako-funkcionise">{nav.howItWorks}</FooterLink>
          <FooterLink href="/#cenovnik">{nav.pricing}</FooterLink>
          <FooterLink href="/#faq">{nav.faq}</FooterLink>
          <FooterLink href="/privatnost">{nav.privacy}</FooterLink>
          <FooterLink href="/uslovi-koriscenja">{nav.terms}</FooterLink>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">{nav.copyright(new Date().getFullYear())}</p>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-muted-foreground transition hover:text-foreground">
      {children}
    </Link>
  );
}
