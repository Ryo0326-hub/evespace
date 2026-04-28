-- Free-form draggable sticker overlays per memory post (persisted client placements).
alter table if exists public.memory_posts
  add column if not exists overlay_stickers jsonb not null default '[]'::jsonb;
