create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  category text,
  start_time timestamptz,
  end_time timestamptz,
  location_name text,
  address text,
  google_maps_url text,
  latitude double precision,
  longitude double precision,
  selling_goods boolean not null default false,
  goods_description text,
  board_background_theme text not null default 'space' check (
    board_background_theme in (
      'space',
      'milky_way',
      'festival_night',
      'scrapbook',
      'pastel_sky',
      'dark_minimal'
    )
  ),
  moderation_mode text not null default 'pre_approval' check (
    moderation_mode in ('pre_approval', 'post_first')
  ),
  visibility text not null default 'public' check (
    visibility in ('public', 'unlisted', 'private')
  ),
  star_x double precision not null,
  star_y double precision not null,
  star_size double precision not null default 1,
  star_brightness double precision not null default 1,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_admins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create table public.event_schedules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text,
  location_name text,
  start_time timestamptz,
  end_time timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_posts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_display_name text,
  image_url text not null,
  caption text,
  frame_style text not null default 'none' check (
    frame_style in ('none', 'polaroid', 'soft_rounded', 'film', 'festival', 'space_glow')
  ),
  sticky_note_style text not null default 'default' check (
    sticky_note_style in ('default', 'yellow', 'pink', 'blue', 'glass')
  ),
  sticker_id text,
  board_x double precision,
  board_y double precision,
  rotation double precision not null default 0,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'removed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_visibility_idx on public.events(visibility);
create index events_slug_idx on public.events(slug);
create index event_schedules_event_id_idx on public.event_schedules(event_id);
create index memory_posts_event_status_idx on public.memory_posts(event_id, status);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_admins enable row level security;
alter table public.event_schedules enable row level security;
alter table public.memory_posts enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_event_admin(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1 from public.event_admins
      where event_id = target_event_id and user_id = auth.uid()
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "Profiles are readable" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Public events are readable" on public.events
  for select using (visibility = 'public' or public.is_event_admin(id));

create policy "Authenticated users can create events" on public.events
  for insert with check (auth.uid() is not null);

create policy "Event admins can update events" on public.events
  for update using (public.is_event_admin(id)) with check (public.is_event_admin(id));

create policy "Event admins can delete events" on public.events
  for delete using (public.is_event_admin(id));

create policy "Event admins are readable by members" on public.event_admins
  for select using (public.is_event_admin(event_id) or user_id = auth.uid());

create policy "Event creators can add admins" on public.event_admins
  for insert with check (
    public.is_super_admin()
    or exists (
      select 1 from public.events
      where events.id = event_admins.event_id and events.created_by = auth.uid()
    )
  );

create policy "Public schedules are readable" on public.event_schedules
  for select using (
    exists (
      select 1 from public.events
      where events.id = event_schedules.event_id
        and (events.visibility = 'public' or public.is_event_admin(events.id))
    )
  );

create policy "Event admins can manage schedules" on public.event_schedules
  for all using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

create policy "Approved public memory posts are readable" on public.memory_posts
  for select using (
    status = 'approved'
    and exists (
      select 1 from public.events
      where events.id = memory_posts.event_id and events.visibility = 'public'
    )
  );

create policy "Event admins can read all memory posts" on public.memory_posts
  for select using (public.is_event_admin(event_id));

create policy "Users can create memory posts for public events" on public.memory_posts
  for insert with check (
    exists (
      select 1 from public.events
      where events.id = memory_posts.event_id and events.visibility = 'public'
    )
  );

create policy "Users can update own pending memory posts" on public.memory_posts
  for update using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid());

create policy "Event admins can moderate memory posts" on public.memory_posts
  for update using (public.is_event_admin(event_id)) with check (public.is_event_admin(event_id));

create policy "Users can delete own memory posts" on public.memory_posts
  for delete using (user_id = auth.uid());

create policy "Event admins can delete memory posts" on public.memory_posts
  for delete using (public.is_event_admin(event_id));

insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', true)
on conflict (id) do nothing;

create policy "Anyone can view memory photos" on storage.objects
  for select using (bucket_id = 'memory-photos');

create policy "Authenticated users can upload memory photos" on storage.objects
  for insert with check (
    bucket_id = 'memory-photos'
    and auth.uid() is not null
    and lower((storage.foldername(name))[1]) <> ''
  );
