create extension if not exists "pgcrypto";

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  board_type text not null default 'private_memory'
    check (board_type in ('official_event', 'private_memory')),
  title text not null,
  slug text unique,
  description text,
  category text,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  owner_clerk_user_id text not null,
  visibility text not null default 'private'
    check (visibility in ('public', 'private', 'unlisted')),
  sharing_scope text not null default 'owner_only'
    check (sharing_scope in ('owner_only', 'followers', 'selected_users', 'public')),
  start_time timestamptz,
  end_time timestamptz,
  location_name text,
  address text,
  google_maps_url text,
  latitude double precision,
  longitude double precision,
  selling_goods boolean not null default false,
  goods_description text,
  board_background_theme text not null default 'soft_cream'
    check (board_background_theme in ('soft_cream', 'pale_blue', 'pale_pink', 'pale_green', 'pale_lavender')),
  moderation_mode text not null default 'post_first'
    check (moderation_mode in ('pre_approval', 'post_first')),
  verification_status text not null default 'not_applicable'
    check (verification_status in ('not_applicable', 'unverified', 'pending_review', 'verified', 'rejected')),
  verification_requested_at timestamptz,
  verification_reviewed_at timestamptz,
  verification_reviewed_by text,
  verification_notes text,
  official_website_url text,
  official_social_url text,
  organizer_email text,
  star_x double precision,
  star_y double precision,
  star_size double precision not null default 1,
  star_brightness double precision not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.board_schedules (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  description text,
  location_name text,
  start_time timestamptz,
  end_time timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  clerk_user_id text not null,
  role text not null default 'viewer'
    check (role in ('viewer', 'contributor', 'admin', 'owner')),
  created_at timestamptz not null default now(),
  unique(board_id, profile_id)
);

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_profile_id uuid not null references public.profiles(id) on delete cascade,
  following_profile_id uuid not null references public.profiles(id) on delete cascade,
  follower_clerk_user_id text not null,
  following_clerk_user_id text not null,
  created_at timestamptz not null default now(),
  unique(follower_profile_id, following_profile_id),
  check (follower_profile_id <> following_profile_id)
);

alter table if exists public.memory_posts
  add column if not exists board_id uuid references public.boards(id) on delete cascade,
  add column if not exists stickers jsonb not null default '[]'::jsonb;

alter table if exists public.memory_posts
  alter column event_id drop not null;

create index if not exists idx_boards_public_official
  on public.boards(board_type, visibility, verification_status, start_time);
create index if not exists idx_boards_owner_clerk
  on public.boards(owner_clerk_user_id, created_at desc);
create index if not exists idx_boards_owner_profile
  on public.boards(owner_profile_id, created_at desc);
create index if not exists idx_boards_slug
  on public.boards(slug);
create index if not exists idx_board_schedules_board_sort
  on public.board_schedules(board_id, sort_order, start_time);
create index if not exists idx_board_members_board
  on public.board_members(board_id);
create index if not exists idx_board_members_clerk
  on public.board_members(clerk_user_id);
create index if not exists idx_user_follows_follower
  on public.user_follows(follower_profile_id);
create index if not exists idx_user_follows_following
  on public.user_follows(following_profile_id);
create index if not exists idx_user_follows_follower_clerk
  on public.user_follows(follower_clerk_user_id);
create index if not exists idx_user_follows_following_clerk
  on public.user_follows(following_clerk_user_id);
create index if not exists idx_memory_posts_board_status
  on public.memory_posts(board_id, status, created_at desc);

insert into public.boards (
  board_type,
  title,
  slug,
  description,
  category,
  owner_profile_id,
  owner_clerk_user_id,
  visibility,
  sharing_scope,
  start_time,
  end_time,
  location_name,
  address,
  google_maps_url,
  latitude,
  longitude,
  selling_goods,
  goods_description,
  board_background_theme,
  moderation_mode,
  verification_status,
  verification_requested_at,
  verification_reviewed_at,
  verification_reviewed_by,
  verification_notes,
  official_website_url,
  official_social_url,
  organizer_email,
  star_x,
  star_y,
  star_size,
  star_brightness,
  created_at,
  updated_at
)
select
  'official_event',
  e.title,
  e.slug,
  e.description,
  e.category,
  e.created_by_profile_id,
  coalesce(e.created_by_clerk_user_id, 'legacy-platform-admin'),
  e.visibility,
  'public',
  e.start_time,
  e.end_time,
  e.location_name,
  e.address,
  e.google_maps_url,
  e.latitude,
  e.longitude,
  e.selling_goods,
  e.goods_description,
  case
    when e.board_background_theme = 'pastel_sky' then 'pale_blue'
    when e.board_background_theme = 'scrapbook' then 'soft_cream'
    else 'soft_cream'
  end,
  e.moderation_mode,
  e.verification_status,
  e.verification_requested_at,
  e.verification_reviewed_at,
  e.verification_reviewed_by,
  e.verification_notes,
  e.official_website_url,
  e.official_social_url,
  e.organizer_email,
  e.star_x,
  e.star_y,
  e.star_size,
  e.star_brightness,
  e.created_at,
  e.updated_at
from public.events e
where exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'events'
)
on conflict (slug) do nothing;

insert into public.board_schedules (
  board_id,
  title,
  description,
  location_name,
  start_time,
  end_time,
  sort_order,
  created_at,
  updated_at
)
select
  b.id,
  s.title,
  s.description,
  s.location_name,
  s.start_time,
  s.end_time,
  s.sort_order,
  s.created_at,
  s.updated_at
from public.event_schedules s
join public.events e on e.id = s.event_id
join public.boards b on b.slug = e.slug
where exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'event_schedules'
)
on conflict do nothing;

update public.memory_posts mp
set board_id = b.id
from public.events e
join public.boards b on b.slug = e.slug
where mp.event_id = e.id
  and mp.board_id is null;

alter table public.boards enable row level security;
alter table public.board_schedules enable row level security;
alter table public.board_members enable row level security;
alter table public.user_follows enable row level security;

drop policy if exists "Verified official boards are readable" on public.boards;
create policy "Verified official boards are readable" on public.boards
  for select using (
    board_type = 'official_event'
    and visibility = 'public'
    and verification_status = 'verified'
  );

drop policy if exists "Verified official board schedules are readable" on public.board_schedules;
create policy "Verified official board schedules are readable" on public.board_schedules
  for select using (
    exists (
      select 1 from public.boards
      where boards.id = board_schedules.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.verification_status = 'verified'
    )
  );

drop policy if exists "Approved public board memory posts are readable" on public.memory_posts;
create policy "Approved public board memory posts are readable" on public.memory_posts
  for select using (
    status = 'approved'
    and exists (
      select 1 from public.boards
      where boards.id = memory_posts.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.verification_status = 'verified'
    )
  );
