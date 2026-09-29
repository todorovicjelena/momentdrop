// Freemium event plans — shared by upload gating (server) and pricing copy (marketing pages).

export const PLAN_LIMITS = {
  free: { maxUploads: 60, storageDays: 14 },
  premium: { maxUploads: 300, storageDays: 182 },
  deluxe: { maxUploads: 5000, storageDays: 365 },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

// Paid plans only — "free" has no price or Lemon Squeezy variant.
export const PAID_PLANS = ["premium", "deluxe"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];

export const PLAN_PRICE_EUR: Record<PaidPlan, number> = { premium: 29, deluxe: 49 };

export function storageExpiresAt(plan: Plan, from = new Date()) {
  return new Date(from.getTime() + PLAN_LIMITS[plan].storageDays * 24 * 60 * 60 * 1000);
}
