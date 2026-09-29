import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { MarketingShell } from "@/components/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const c = t.marketing.pricing;

const BUSINESS_CONTACT = "mailto:usemomentdrop@gmail.com";

export const metadata: Metadata = { title: c.title };

export default function PricingPage() {
  return (
    <MarketingShell wide>
      <div className="max-w-2xl">
        <p className="font-semibold tracking-wide text-primary">{c.kicker}</p>
        <h1 className="mt-2 font-serif text-4xl leading-[0.95] sm:text-6xl">{c.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{c.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PlanTile plan={c.free} href="/signup" />
        <PlanTile plan={c.premium} href="/signup" highlighted />
        <PlanTile plan={c.deluxe} href="/signup" />
      </div>

      {/* Business — a wide banner, since companies contact us instead of self-checkout */}
      <div className="flex flex-col gap-5 rounded-[2rem] bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="font-serif text-2xl">{c.business.name}</h2>
          <p className="mt-1 text-muted-foreground">{c.business.subtitle}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {c.business.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <Link href={BUSINESS_CONTACT} className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
          {c.business.cta}
        </Link>
      </div>

      <p className="text-center text-muted-foreground">
        {c.faqHint}{" "}
        <Link href="/faq" className="font-semibold text-foreground underline underline-offset-4">
          {c.faqLink}
        </Link>
      </p>
    </MarketingShell>
  );
}

function PlanTile({
  plan,
  href,
  highlighted,
}: {
  plan: { name: string; price: string; period: string; features: readonly string[]; cta: string; badge?: string };
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-[2rem] p-6 shadow-sm",
        highlighted ? "bg-ink text-cream ring-2 ring-primary" : "bg-card",
      )}
    >
      <div>
        {plan.badge && (
          <span className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {plan.badge}
          </span>
        )}
        <h2 className="font-serif text-2xl">{plan.name}</h2>
        <p className="mt-2 flex items-baseline gap-1">
          <span className="font-serif text-4xl">{plan.price}</span>
          <span className={cn("text-sm", highlighted ? "text-cream/70" : "text-muted-foreground")}>{plan.period}</span>
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={cn(
          buttonVariants({ size: "lg", variant: highlighted ? "default" : "outline" }),
          "mt-auto",
          !highlighted && "border-0 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        )}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
