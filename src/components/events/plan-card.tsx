"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-field";
import { createUpgradeCheckout } from "@/app/dashboard/events/[id]/actions";
import { PAID_PLANS, PLAN_LIMITS, PLAN_PRICE_EUR, type Plan, type PaidPlan } from "@/lib/plans";
import { t } from "@/lib/i18n";

const formatDate = (iso: string) => new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export function PlanCard({ eventId, plan, uploadCount, storageExpiresAt }: { eventId: string; plan: Plan; uploadCount: number; storageExpiresAt: string | null }) {
  const [pendingPlan, setPendingPlan] = useState<PaidPlan | null>(null);
  const [error, setError] = useState<string>();
  const tp = t.settings.plan;

  async function upgrade(target: PaidPlan) {
    setPendingPlan(target);
    setError(undefined);
    const result = await createUpgradeCheckout(eventId, target);
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }
    setError(result.error);
    setPendingPlan(null);
  }

  // Only offer plans that include more than what the event already has.
  const upgrades = PAID_PLANS.filter((p) => PLAN_LIMITS[p].storageDays > PLAN_LIMITS[plan].storageDays);

  return (
    <section className="flex flex-col gap-4 rounded-[2rem] bg-card p-5 shadow-sm sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl">{tp.title}</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">{tp.planName[plan]}</span>
      </div>
      <p className="text-sm text-muted-foreground">{tp.uploadsUsed(uploadCount, PLAN_LIMITS[plan].maxUploads)}</p>
      {storageExpiresAt && <p className="text-sm text-muted-foreground">{tp.storageUntil(formatDate(storageExpiresAt))}</p>}
      {upgrades.length > 0 && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            {upgrades.map((target) => (
              <Button key={target} type="button" onClick={() => upgrade(target)} disabled={pendingPlan !== null} className="gap-2">
                <Sparkles className="size-4" aria-hidden />
                {tp.upgradeButton(tp.planName[target], `${PLAN_PRICE_EUR[target]} €`)}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{tp.upgradeHint}</p>
          <FormError message={error} />
        </>
      )}
    </section>
  );
}
