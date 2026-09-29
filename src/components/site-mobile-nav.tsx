"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const LINKS = [
  { href: "/#kako-funkcionise", label: () => t.marketing.nav.howItWorks },
  { href: "/#cenovnik", label: () => t.marketing.nav.pricing },
  { href: "/#faq", label: () => t.marketing.nav.faq },
];

// Hamburger menu for the home page header nav — only shown below md, where
// the inline "Kako funkcioniše · Cenovnik · Pitanja" row doesn't fit.
// The icon itself morphs into an X; slides in from the right over a
// transparent, blurred backdrop.
export function SiteMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t.nav.menu}
        className="relative z-50 grid size-10 place-items-center rounded-full border-2 border-input bg-card"
      >
        <span className="relative block size-4">
          <span
            className={cn(
              "absolute left-0 h-0.5 w-4 rounded-full bg-foreground transition-all duration-300 ease-out",
              open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5",
            )}
          />
          <span
            className={cn(
              "absolute top-1/2 left-0 h-0.5 w-4 -translate-y-1/2 rounded-full bg-foreground transition-opacity duration-200",
              open ? "opacity-0" : "opacity-100",
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-0.5 w-4 rounded-full bg-foreground transition-all duration-300 ease-out",
              open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0.5",
            )}
          />
        </span>
      </button>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-72 max-w-[80vw] flex-col gap-1 rounded-l-[2rem] bg-cream p-6 pt-20 shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="rounded-2xl px-4 py-3 text-base font-semibold transition hover:bg-lilac-soft"
          >
            {label()}
          </Link>
        ))}
      </div>
    </div>
  );
}
