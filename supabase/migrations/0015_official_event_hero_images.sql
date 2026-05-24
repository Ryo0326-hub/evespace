alter table public.boards
  add column if not exists hero_image_url text,
  add column if not exists hero_image_storage_bucket text,
  add column if not exists hero_image_storage_path text;

insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public event covers are readable" on storage.objects;
create policy "Public event covers are readable" on storage.objects
  for select using (bucket_id = 'event-covers');
