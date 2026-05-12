alter table public.boards
  add column if not exists official_access_information text,
  add column if not exists official_sharing_scope text not null default 'public'
    check (official_sharing_scope in ('public', 'selected_people', 'organization')),
  add column if not exists posting_permission text not null default 'signed_in_users'
    check (posting_permission in ('signed_in_users', 'approved_users')),
  add column if not exists allowed_user_ids text[] not null default '{}',
  add column if not exists allowed_emails text[] not null default '{}',
  add column if not exists allowed_organization_domains text[] not null default '{}';

create table if not exists public.official_event_goods_services (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  description text,
  price text,
  image_url text,
  external_link text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_official_event_goods_services_board
  on public.official_event_goods_services(board_id, sort_order);

alter table public.official_event_goods_services enable row level security;

drop policy if exists "Public official event goods are readable" on public.official_event_goods_services;
create policy "Public official event goods are readable" on public.official_event_goods_services
  for select using (
    exists (
      select 1 from public.boards
      where boards.id = official_event_goods_services.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.official_sharing_scope = 'public'
        and boards.verification_status <> 'rejected'
    )
  );

drop policy if exists "Public official boards are readable" on public.boards;
drop policy if exists "Verified official boards are readable" on public.boards;
create policy "Public official boards are readable" on public.boards
  for select using (
    board_type = 'official_event'
    and visibility = 'public'
    and official_sharing_scope = 'public'
    and verification_status <> 'rejected'
  );

drop policy if exists "Public official board schedules are readable" on public.board_schedules;
drop policy if exists "Verified official board schedules are readable" on public.board_schedules;
create policy "Public official board schedules are readable" on public.board_schedules
  for select using (
    exists (
      select 1 from public.boards
      where boards.id = board_schedules.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.official_sharing_scope = 'public'
        and boards.verification_status <> 'rejected'
    )
  );
