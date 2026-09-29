import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForVariant, verifyWebhookSignature, type LemonSqueezyOrderWebhook } from "@/lib/lemonsqueezy";
import { storageExpiresAt } from "@/lib/plans";

// Lemon Squeezy has no session/cookies to prove who's calling — the HMAC
// signature is the only trust boundary, and DB writes go through the
// service-role client (same pattern as guest uploads).
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as LemonSqueezyOrderWebhook;
  if (payload.meta.event_name !== "order_created" || payload.data.attributes.status !== "paid") {
    return NextResponse.json({ ok: true }); // not a paid order — nothing to do
  }

  const eventId = payload.meta.custom_data?.event_id;
  if (!eventId) return NextResponse.json({ error: "missing event_id" }, { status: 400 });

  const variantId = payload.data.attributes.first_order_item?.variant_id;
  const plan = variantId != null ? planForVariant(variantId) : null;
  if (!plan) return NextResponse.json({ error: "unknown variant" }, { status: 400 });

  const { error } = await createAdminClient()
    .from("events")
    .update({
      plan,
      plan_purchased_at: new Date().toISOString(),
      storage_expires_at: storageExpiresAt(plan).toISOString(),
      lemonsqueezy_order_id: payload.data.id,
    })
    .eq("id", eventId);

  if (error) {
    console.error("Lemon Squeezy webhook: failed to upgrade event:", error.code, error.message);
    return NextResponse.json({ error: "db update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
