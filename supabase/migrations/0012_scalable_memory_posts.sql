-- Scalable memory post architecture.
--
-- Manual Supabase operations that still matter outside this migration:
-- 1. Upgrade the Supabase plan/database size if storage or row volume outgrows the free tier.
-- 2. Use Supabase Storage buckets for media; do not put base64 or binary blobs in Postgres.
-- 3. Check database size and table growth in the Supabase dashboard as boards grow.
-- 4. Use the pooled connection string for serverless deployments to avoid connection exhaustion.

create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values
  ('memory-post-media', 'memory-post-media', true),
  ('event-covers', 'event-covers', true),
  ('stickers', 'stickers', true),
  ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public memory post media is readable" on storage.objects;
create policy "Public memory post media is readable" on storage.objects
  for select using (
    bucket_id in ('memory-post-media', 'event-covers', 'stickers', 'profile-avatars')
  );

drop policy if exists "Authenticated users can upload memory post media" on storage.objects;
create policy "Authenticated users can upload memory post media" on storage.objects
  for insert with check (
    bucket_id = 'memory-post-media'
    and auth.uid() is not null
    and lower((storage.foldername(name))[1]) <> ''
  );

alter table if exists public.events
  add column if not exists event_type text not null default 'official_event',
  add column if not exists is_verified boolean not null default false;

update public.events
set is_verified = verification_status = 'verified'
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'events'
    and column_name = 'verification_status'
);

alter table if exists public.boards
  add column if not exists event_id uuid references public.events(id) on delete set null;

comment on table public.boards is
  'Current EveSpace memory_boards table. Kept as boards for MVP compatibility; event_id links official-event boards to legacy/future events rows.';

create or replace view public.memory_boards as
select * from public.boards;

create or replace view public.event_goods_services as
select
  id,
  board_id as event_id,
  name,
  description,
  price,
  image_url,
  external_link,
  sort_order,
  created_at,
  updated_at
from public.official_event_goods_services;

alter table if exists public.memory_posts
  add column if not exists author_id uuid references public.profiles(id) on delete set null;

update public.memory_posts
set author_id = profile_id
where author_id is null
  and profile_id is not null;

alter table if exists public.memory_posts
  alter column image_url drop not null;

comment on column public.memory_posts.image_url is
  'Legacy compatibility only. New memory post media lives in memory_post_media with storage_bucket and storage_path.';
comment on column public.memory_posts.storage_path is
  'Legacy compatibility only. New memory post media paths live in memory_post_media.';
comment on column public.memory_posts.stickers is
  'Legacy compatibility only. New sticker selections live in memory_post_stickers.';
comment on column public.memory_posts.overlay_stickers is
  'Legacy compatibility only. New sticker overlays live in memory_post_stickers.';

create table if not exists public.stickers (
  id text primary key,
  name text not null,
  category text not null,
  storage_bucket text,
  storage_path text,
  public_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.stickers (id, name, category, public_url)
values
  ('pixel-butterfly', 'Pixel Butterfly', 'pixel', '/stickers/pixel-butterfly.png'),
  ('pixel-dolphin', 'Pixel Dolphin', 'pixel', '/stickers/pixel-dolphin.png'),
  ('pixel-egg', 'Pixel Egg', 'pixel', '/stickers/pixel-egg.png'),
  ('doodle-camera', 'Doodle Camera', 'doodle', '/stickers/doodle-camera.png'),
  ('doodle-chocolate', 'Doodle Chocolate', 'doodle', '/stickers/doodle-chocolate.png'),
  ('clay-carrot', 'Clay Carrot', 'clay', '/stickers/clay-carrot.png'),
  ('clay-duck', 'Clay Duck', 'clay', '/stickers/clay-duck.png')
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  public_url = excluded.public_url,
  updated_at = now();

create table if not exists public.memory_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.memory_posts(id) on delete cascade,
  board_id uuid references public.boards(id) on delete cascade,
  storage_bucket text not null default 'memory-post-media',
  storage_path text not null,
  media_type text not null default 'image'
    check (media_type in ('image', 'video', 'audio', 'other')),
  mime_type text,
  byte_size bigint,
  original_file_name text,
  width integer,
  height integer,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

create table if not exists public.memory_post_stickers (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.memory_posts(id) on delete cascade,
  board_id uuid references public.boards(id) on delete cascade,
  sticker_id text not null,
  sticker_kind text not null default 'overlay'
    check (sticker_kind in ('corner', 'overlay')),
  placement text
    check (placement in ('top_left', 'top_right', 'bottom_left', 'bottom_right')),
  x double precision,
  y double precision,
  rotation double precision not null default 0,
  size double precision not null default 68,
  client_sticker_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (sticker_kind = 'corner' and placement is not null)
    or
    (sticker_kind = 'overlay' and x is not null and y is not null)
  )
);

create index if not exists idx_memory_posts_board_created_desc
  on public.memory_posts(board_id, created_at desc);
create index if not exists idx_memory_posts_board_status_created_desc
  on public.memory_posts(board_id, status, created_at desc);
create index if not exists idx_memory_posts_event_created_desc
  on public.memory_posts(event_id, created_at desc);
create index if not exists idx_memory_posts_author_id
  on public.memory_posts(author_id);
create index if not exists idx_memory_posts_profile_id
  on public.memory_posts(profile_id);
create index if not exists idx_memory_boards_event_id
  on public.boards(event_id);
create index if not exists idx_memory_post_media_post_id
  on public.memory_post_media(post_id);
create index if not exists idx_memory_post_media_board_id
  on public.memory_post_media(board_id);
create index if not exists idx_memory_post_stickers_post_id
  on public.memory_post_stickers(post_id);
create index if not exists idx_memory_post_stickers_board_id
  on public.memory_post_stickers(board_id);
create index if not exists idx_events_event_type
  on public.events(event_type);
create index if not exists idx_events_is_verified
  on public.events(is_verified);
create index if not exists idx_events_created_by
  on public.events(created_by);
create index if not exists idx_events_created_by_profile_id
  on public.events(created_by_profile_id);
create index if not exists idx_boards_type_verification_created
  on public.boards(board_type, verification_status, created_at desc);

insert into public.memory_post_media (
  post_id,
  board_id,
  storage_bucket,
  storage_path,
  media_type,
  sort_order,
  created_at,
  updated_at
)
select
  id,
  board_id,
  case
    when nullif(storage_path, '') is not null then 'memory-photos'
    else 'legacy-external'
  end,
  coalesce(nullif(storage_path, ''), nullif(image_url, '')),
  'image',
  0,
  created_at,
  updated_at
from public.memory_posts
where coalesce(nullif(storage_path, ''), nullif(image_url, '')) is not null
on conflict (storage_bucket, storage_path) do nothing;

insert into public.memory_post_stickers (
  post_id,
  board_id,
  sticker_id,
  sticker_kind,
  placement,
  sort_order,
  created_at,
  updated_at
)
select
  mp.id,
  mp.board_id,
  sticker.value ->> 'stickerId',
  'corner',
  sticker.value ->> 'placement',
  sticker.ordinality::integer - 1,
  mp.created_at,
  mp.updated_at
from public.memory_posts mp
cross join lateral jsonb_array_elements(coalesce(mp.stickers, '[]'::jsonb))
  with ordinality as sticker(value, ordinality)
where sticker.value ? 'stickerId'
  and sticker.value ? 'placement'
  and (sticker.value ->> 'stickerId') is not null
  and (sticker.value ->> 'placement') is not null
  and sticker.ordinality <= 3
on conflict do nothing;

insert into public.memory_post_stickers (
  post_id,
  board_id,
  sticker_id,
  sticker_kind,
  x,
  y,
  rotation,
  size,
  client_sticker_id,
  sort_order,
  created_at,
  updated_at
)
select
  mp.id,
  mp.board_id,
  sticker.value ->> 'stickerId',
  'overlay',
  (sticker.value ->> 'x')::double precision,
  (sticker.value ->> 'y')::double precision,
  coalesce(nullif(sticker.value ->> 'rotation', '')::double precision, 0),
  coalesce(nullif(sticker.value ->> 'size', '')::double precision, 68),
  sticker.value ->> 'id',
  sticker.ordinality::integer - 1,
  mp.created_at,
  mp.updated_at
from public.memory_posts mp
cross join lateral jsonb_array_elements(coalesce(mp.overlay_stickers, '[]'::jsonb))
  with ordinality as sticker(value, ordinality)
where sticker.value ? 'stickerId'
  and sticker.value ? 'x'
  and sticker.value ? 'y'
  and (sticker.value ->> 'stickerId') is not null
  and (sticker.value ->> 'x') is not null
  and (sticker.value ->> 'y') is not null
  and sticker.ordinality <= 3
on conflict do nothing;

alter table public.stickers enable row level security;
alter table public.memory_post_media enable row level security;
alter table public.memory_post_stickers enable row level security;

drop policy if exists "Stickers are readable" on public.stickers;
create policy "Stickers are readable" on public.stickers
  for select using (true);

drop policy if exists "Approved memory post media is readable" on public.memory_post_media;
create policy "Approved memory post media is readable" on public.memory_post_media
  for select using (
    exists (
      select 1
      from public.memory_posts
      left join public.boards on boards.id = memory_posts.board_id
      where memory_posts.id = memory_post_media.post_id
        and memory_posts.status = 'approved'
        and (
          boards.sharing_scope = 'public'
          or (
            boards.board_type = 'official_event'
            and boards.visibility = 'public'
            and boards.official_sharing_scope = 'public'
            and boards.verification_status <> 'rejected'
          )
        )
    )
  );

drop policy if exists "Approved memory post stickers are readable" on public.memory_post_stickers;
create policy "Approved memory post stickers are readable" on public.memory_post_stickers
  for select using (
    exists (
      select 1
      from public.memory_posts
      left join public.boards on boards.id = memory_posts.board_id
      where memory_posts.id = memory_post_stickers.post_id
        and memory_posts.status = 'approved'
        and (
          boards.sharing_scope = 'public'
          or (
            boards.board_type = 'official_event'
            and boards.visibility = 'public'
            and boards.official_sharing_scope = 'public'
            and boards.verification_status <> 'rejected'
          )
        )
    )
  );

create or replace function public.enforce_official_event_memory_post_sticker_limit()
returns trigger
language plpgsql
as $$
declare
  board_type_value text;
  sticker_count integer;
begin
  select boards.board_type
  into board_type_value
  from public.memory_posts
  join public.boards on boards.id = memory_posts.board_id
  where memory_posts.id = new.post_id;

  if board_type_value = 'official_event' then
    select count(*)
    into sticker_count
    from public.memory_post_stickers
    where post_id = new.post_id
      and id <> new.id;

    if sticker_count >= 3 then
      raise exception 'Official event posts can include up to 3 stickers.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_official_event_sticker_limit on public.memory_post_stickers;
create trigger trg_official_event_sticker_limit
  before insert or update on public.memory_post_stickers
  for each row execute function public.enforce_official_event_memory_post_sticker_limit();
