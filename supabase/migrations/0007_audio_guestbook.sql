-- Audio guestbook (Premium only) — guests can leave a short voice message
-- alongside photos/videos.

alter table public.uploads drop constraint uploads_file_type_check;
alter table public.uploads add constraint uploads_file_type_check check (file_type in ('image', 'video', 'audio'));

notify pgrst, 'reload schema';
