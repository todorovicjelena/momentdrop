import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const c = t.marketing.howItWorks;

export const metadata: Metadata = { title: c.title };

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <div>
        <p className="font-semibold tracking-wide text-primary">{c.kicker}</p>
        <h1 className="mt-2 font-serif text-4xl leading-[0.95] sm:text-6xl">{c.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{c.subtitle}</p>
      </div>

      <ol className="flex flex-col gap-4">
        {c.steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-[1.75rem] bg-card p-5 shadow-sm sm:p-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-xl text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <h2 className="font-serif text-xl">{step.title}</h2>
              <p className="mt-1 text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "self-start shadow-lg shadow-primary/30")}>
        {c.cta}
      </Link>
    </MarketingShell>
  );
}
