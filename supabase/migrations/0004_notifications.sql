create extension if not exists "pgcrypto";

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid references public.profiles(id) on delete cascade,
  recipient_clerk_user_id text not null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_clerk_user_id text,
  notification_type text not null
    check (notification_type in ('followed_you', 'you_followed')),
  title text not null,
  body text,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient_created
  on public.notifications(recipient_profile_id, created_at desc);
create index if not exists idx_notifications_recipient_clerk_created
  on public.notifications(recipient_clerk_user_id, created_at desc);
create index if not exists idx_notifications_read
  on public.notifications(recipient_profile_id, read_at);

alter table public.notifications enable row level security;
