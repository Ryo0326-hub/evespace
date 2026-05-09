create extension if not exists "pgcrypto";

create table if not exists public.user_follow_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_profile_id uuid not null references public.profiles(id) on delete cascade,
  requester_clerk_user_id text not null,
  requested_clerk_user_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_profile_id, requested_profile_id),
  check (requester_profile_id <> requested_profile_id)
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_profile_id uuid not null references public.profiles(id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles(id) on delete cascade,
  blocker_clerk_user_id text not null,
  blocked_clerk_user_id text not null,
  created_at timestamptz not null default now(),
  unique(blocker_profile_id, blocked_profile_id),
  check (blocker_profile_id <> blocked_profile_id)
);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid not null references public.profiles(id) on delete cascade,
  reported_profile_id uuid not null references public.profiles(id) on delete cascade,
  reporter_clerk_user_id text not null,
  reported_clerk_user_id text not null,
  reason text,
  created_at timestamptz not null default now(),
  check (reporter_profile_id <> reported_profile_id)
);

create index if not exists idx_follow_requests_requested_status
  on public.user_follow_requests(requested_profile_id, status, created_at desc);
create index if not exists idx_follow_requests_requester_status
  on public.user_follow_requests(requester_profile_id, status, created_at desc);
create index if not exists idx_user_blocks_blocker
  on public.user_blocks(blocker_profile_id);
create index if not exists idx_user_blocks_blocked
  on public.user_blocks(blocked_profile_id);
create index if not exists idx_user_reports_reported
  on public.user_reports(reported_profile_id, created_at desc);

alter table public.user_follow_requests enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
