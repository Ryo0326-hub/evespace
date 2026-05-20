-- Ensures existing Supabase projects created before comment replies can store
-- threaded replies. Run this in Supabase if reply posting reports that
-- memory_post_comments.parent_comment_id does not exist.

alter table if exists public.memory_post_comments
  add column if not exists parent_comment_id uuid
    references public.memory_post_comments(id) on delete cascade;

create index if not exists idx_memory_post_comments_parent_created
  on public.memory_post_comments(parent_comment_id, created_at);

comment on column public.memory_post_comments.parent_comment_id is
  'Top-level memory_post_comments row this comment replies to.';

notify pgrst, 'reload schema';
