-- Adds a second paid tier ("deluxe") alongside free/premium.

alter table public.events drop constraint events_plan_check;
alter table public.events add constraint events_plan_check check (plan in ('free', 'premium', 'deluxe'));

notify pgrst, 'reload schema';
