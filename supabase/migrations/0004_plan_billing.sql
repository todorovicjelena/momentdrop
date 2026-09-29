-- Freemium plan + Lemon Squeezy billing fields on events.
-- Free by default; a one-time payment (webhook) flips an event to 'premium'.

alter table public.events
  add column plan text not null default 'free' check (plan in ('free', 'premium')),
  add column plan_purchased_at timestamptz,
  add column storage_expires_at timestamptz,
  add column lemonsqueezy_order_id text;

notify pgrst, 'reload schema';
