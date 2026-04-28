create extension if not exists "pgcrypto";

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

alter table if exists public.profiles
  drop constraint if exists profiles_id_fkey;

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add column if not exists clerk_user_id text,
  add column if not exists email text;

alter table if exists public.profiles
  alter column id set default gen_random_uuid(),
  alter column role set default 'user';

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    create table public.profiles (
      id uuid primary key default gen_random_uuid(),
      clerk_user_id text unique not null,
      display_name text,
      avatar_url text,
      email text,
      role text not null default 'user',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

alter table if exists public.events
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists verification_requested_at timestamptz,
  add column if not exists verification_reviewed_at timestamptz,
  add column if not exists verification_reviewed_by text,
  add column if not exists verification_notes text,
  add column if not exists official_website_url text,
  add column if not exists official_social_url text,
  add column if not exists organizer_email text,
  add column if not exists created_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_by_clerk_user_id text;

alter table if exists public.event_admins
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade,
  add column if not exists clerk_user_id text;

alter table if exists public.event_admins
  alter column user_id drop not null;

alter table if exists public.memory_posts
  add column if not exists profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists clerk_user_id text,
  add column if not exists storage_path text;

create index if not exists idx_profiles_clerk_user_id on public.profiles(clerk_user_id);
create unique index if not exists idx_profiles_clerk_user_id_unique
  on public.profiles(clerk_user_id)
  where clerk_user_id is not null;
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_created_by_clerk_user_id on public.events(created_by_clerk_user_id);
create index if not exists idx_events_verification_status on public.events(verification_status);
create index if not exists idx_event_admins_clerk_user_id on public.event_admins(clerk_user_id);
create index if not exists idx_event_admins_event_id on public.event_admins(event_id);
create unique index if not exists idx_event_admins_event_clerk_unique
  on public.event_admins(event_id, clerk_user_id)
  where clerk_user_id is not null;
create index if not exists idx_memory_posts_event_id_status on public.memory_posts(event_id, status);
create index if not exists idx_memory_posts_clerk_user_id on public.memory_posts(clerk_user_id);

insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', true)
on conflict (id) do nothing;
