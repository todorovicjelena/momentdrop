-- Full-page background image (paid plans only) — replaces the default swirl
-- decoration on the guest page so the event doesn't look MomentDrop-branded.

alter table public.events add column background_key text;

notify pgrst, 'reload schema';
