-- Links an upload to the scavenger-hunt prompt it was sent for, if any.
-- Nullable — most uploads aren't tagged. The prompt text itself lives in
-- i18n (src/lib/i18n/{sr,en}.ts, scavengerHunt.prompts[event_type][index]),
-- not duplicated into the row — this is just the array index into that list.

alter table public.uploads add column hunt_prompt_index smallint check (hunt_prompt_index >= 0);

notify pgrst, 'reload schema';
