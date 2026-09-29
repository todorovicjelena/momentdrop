import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SiteShell } from "@/components/site-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteMobileNav } from "@/components/site-mobile-nav";
import { DancingFlowers } from "@/components/dancing-flowers";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const BUSINESS_CONTACT = "mailto:usemomentdrop@gmail.com";

export default function Home() {
  const howItWorks = t.marketing.howItWorks;
  const pricing = t.marketing.pricing;
  const faq = t.marketing.faq;

  return (
    <>
    <SiteShell
      headerRight={
        <>
          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            <Link href="/#kako-funkcionise" className="text-foreground/80 transition hover:text-foreground">
              {t.marketing.nav.howItWorks}
            </Link>
            <Link href="/#cenovnik" className="text-foreground/80 transition hover:text-foreground">
              {t.marketing.nav.pricing}
            </Link>
            <Link href="/#faq" className="text-foreground/80 transition hover:text-foreground">
              {t.marketing.nav.faq}
            </Link>
          </nav>
          <SiteMobileNav />
        </>
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

    <section id="kako-funkcionise" className="mx-auto mt-10 w-full max-w-6xl px-4">
      <div className="rounded-[2.5rem] bg-card px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <p className="text-center font-semibold tracking-wide text-primary">{howItWorks.kicker}</p>
        <h2 className="mt-2 text-center font-serif text-3xl leading-[0.95] sm:text-5xl">{howItWorks.title}</h2>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-[1.75rem] bg-lilac-soft p-5">
              <span className="grid size-10 place-items-center rounded-full bg-primary font-serif text-lg text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="font-serif text-xl">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "shadow-lg shadow-primary/30")}>
            {howItWorks.cta}
          </Link>
        </div>
      </div>
    </section>

    <section id="cenovnik" className="mx-auto mt-10 w-full max-w-6xl px-4">
      <div className="rounded-[2.5rem] bg-card px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <p className="text-center font-semibold tracking-wide text-primary">{pricing.kicker}</p>
        <h2 className="mt-2 text-center font-serif text-3xl leading-[0.95] sm:text-5xl">{pricing.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">{pricing.subtitle}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <PlanTile plan={pricing.free} href="/signup" />
          <PlanTile plan={pricing.premium} href="/signup" highlighted />
          <PlanTile plan={pricing.deluxe} href="/signup" />
        </div>

        {/* Business — a wide banner, since companies contact us instead of self-checkout */}
        <div className="mt-6 flex flex-col gap-5 rounded-[2rem] bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="font-serif text-2xl">{pricing.business.name}</h3>
            <p className="mt-1 text-muted-foreground">{pricing.business.subtitle}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {pricing.business.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <Link href={BUSINESS_CONTACT} className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
            {pricing.business.cta}
          </Link>
        </div>

        <p className="mt-6 text-center text-muted-foreground">
          {pricing.faqHint}{" "}
          <Link href="/#faq" className="font-semibold text-foreground underline underline-offset-4">
            {pricing.faqLink}
          </Link>
        </p>
      </div>
    </section>

    <section id="faq" className="mx-auto mt-10 w-full max-w-6xl px-4">
      <div className="rounded-[2.5rem] bg-card px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <p className="text-center font-semibold tracking-wide text-primary">{faq.kicker}</p>
        <h2 className="mt-2 text-center font-serif text-3xl leading-[0.95] sm:text-5xl">{faq.title}</h2>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
          {faq.items.map((item) => (
            <details key={item.q} className="group rounded-[1.5rem] bg-lilac-soft p-5 open:pb-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.q}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>

    <SiteFooter />
    </>
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
        highlighted ? "bg-ink text-cream ring-2 ring-primary" : "bg-lilac-soft",
      )}
    >
      <div>
        {plan.badge && (
          <span className="mb-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {plan.badge}
          </span>
        )}
        <h3 className="font-serif text-2xl">{plan.name}</h3>
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
          !highlighted && "border-0 bg-card text-foreground hover:bg-white",
        )}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
