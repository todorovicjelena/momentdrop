import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaidPlan } from "@/lib/plans";

// Thin wrapper around the Lemon Squeezy REST API (JSON:API) — no SDK, just fetch.
// Lemon Squeezy is our Merchant of Record: it handles VAT/sales tax and accepts
// sellers Stripe doesn't (Serbia isn't on Stripe's supported-country list).

const API_BASE = "https://api.lemonsqueezy.com/v1";

// Each paid plan is a separate Lemon Squeezy product/variant.
const VARIANT_ENV: Record<PaidPlan, string> = {
  premium: "LEMONSQUEEZY_PREMIUM_VARIANT_ID",
  deluxe: "LEMONSQUEEZY_DELUXE_VARIANT_ID",
};

function apiKey() {
  return process.env.LEMONSQUEEZY_API_KEY!;
}

// Maps a Lemon Squeezy variant id back to the plan it represents — used by
// the webhook to know which plan was purchased.
export function planForVariant(variantId: string | number): PaidPlan | null {
  const id = String(variantId);
  for (const [plan, envVar] of Object.entries(VARIANT_ENV) as [PaidPlan, string][]) {
    if (process.env[envVar] === id) return plan;
  }
  return null;
}

// Creates a one-time-payment checkout for upgrading a single event to the
// given paid plan. `custom.event_id` round-trips through the checkout and
// comes back in the webhook payload's meta.custom_data, letting us know
// which event to upgrade.
export async function createCheckout(eventId: string, plan: PaidPlan, redirectUrl: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: { custom: { event_id: eventId } },
          product_options: { redirect_url: redirectUrl },
        },
        relationships: {
          store: { data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID! } },
          variant: { data: { type: "variants", id: process.env[VARIANT_ENV[plan]]! } },
        },
      },
    }),
  });

  if (!res.ok) {
    console.error("Lemon Squeezy createCheckout failed:", res.status, await res.text());
    return null;
  }
  const json = await res.json();
  return json?.data?.attributes?.url ?? null;
}

// Constant-time signature check — see https://docs.lemonsqueezy.com/help/webhooks.
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET!).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type LemonSqueezyOrderWebhook = {
  meta: { event_name: string; custom_data?: { event_id?: string } };
  data: { id: string; attributes: { status: string; first_order_item?: { variant_id: number } } };
};
