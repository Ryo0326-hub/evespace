create extension if not exists "pgcrypto";

create table if not exists public.memory_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.memory_posts(id) on delete cascade,
  board_id uuid references public.boards(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  clerk_user_id text,
  author_display_name text,
  body text not null check (char_length(body) > 0 and char_length(body) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_memory_post_comments_post_created
  on public.memory_post_comments(post_id, created_at);
create index if not exists idx_memory_post_comments_board_created
  on public.memory_post_comments(board_id, created_at desc);
create index if not exists idx_memory_post_comments_profile_created
  on public.memory_post_comments(profile_id, created_at desc);

alter table public.memory_post_comments enable row level security;

drop policy if exists "Approved official board comments are readable" on public.memory_post_comments;
create policy "Approved official board comments are readable" on public.memory_post_comments
  for select using (
    exists (
      select 1
      from public.memory_posts
      join public.boards on boards.id = memory_posts.board_id
      where memory_posts.id = memory_post_comments.post_id
        and memory_posts.status = 'approved'
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.verification_status = 'verified'
    )
  );

drop policy if exists "Users can delete own comments" on public.memory_post_comments;
create policy "Users can delete own comments" on public.memory_post_comments
  for delete using (profile_id in (
    select id from public.profiles where clerk_user_id = auth.jwt()->>'sub'
  ));
