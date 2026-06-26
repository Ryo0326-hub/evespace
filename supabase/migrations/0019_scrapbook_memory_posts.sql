alter table if exists public.memory_posts
  add column if not exists message_pen_style text not null default 'classic_pen';

alter table if exists public.memory_posts
  drop constraint if exists memory_posts_sticky_note_style_check;

alter table if exists public.memory_posts
  add constraint memory_posts_sticky_note_style_check
  check (
    sticky_note_style in (
      'default',
      'yellow',
      'pink',
      'blue',
      'glass',
      'sky',
      'mint',
      'lavender'
    )
  );

alter table if exists public.memory_posts
  drop constraint if exists memory_posts_message_pen_style_check;

alter table if exists public.memory_posts
  add constraint memory_posts_message_pen_style_check
  check (message_pen_style in ('classic_pen', 'marker', 'fountain_pen'));
