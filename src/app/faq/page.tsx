import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { MarketingShell } from "@/components/marketing-shell";
import { t } from "@/lib/i18n";

const c = t.marketing.faq;

export const metadata: Metadata = { title: c.title };

export default function FaqPage() {
  return (
    <MarketingShell>
      <div>
        <p className="font-semibold tracking-wide text-primary">{c.kicker}</p>
        <h1 className="mt-2 font-serif text-4xl leading-[0.95] sm:text-6xl">{c.title}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {c.items.map((item) => (
          <details key={item.q} className="group rounded-[1.5rem] bg-card p-5 shadow-sm open:pb-5 sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {item.q}
              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-3 text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </MarketingShell>
  );
}
