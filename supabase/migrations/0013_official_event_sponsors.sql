insert into storage.buckets (id, name, public)
values ('event-sponsor-logos', 'event-sponsor-logos', true)
on conflict (id) do nothing;

drop policy if exists "Public event sponsor logos are readable" on storage.objects;
create policy "Public event sponsor logos are readable" on storage.objects
  for select using (bucket_id = 'event-sponsor-logos');

create table if not exists public.official_event_sponsors (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  description text,
  tier text,
  logo_url text,
  logo_storage_bucket text,
  logo_storage_path text,
  website_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_official_event_sponsors_board
  on public.official_event_sponsors(board_id, sort_order);

alter table public.official_event_sponsors enable row level security;

drop policy if exists "Public official event sponsors are readable" on public.official_event_sponsors;
create policy "Public official event sponsors are readable" on public.official_event_sponsors
  for select using (
    exists (
      select 1 from public.boards
      where boards.id = official_event_sponsors.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.official_sharing_scope = 'public'
        and boards.verification_status <> 'rejected'
    )
  );
