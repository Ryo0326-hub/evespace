alter table public.notifications
  drop constraint if exists notifications_notification_type_check;

alter table public.notifications
  add constraint notifications_notification_type_check
  check (
    notification_type in (
      'followed_you',
      'you_followed',
      'follow_requested',
      'memory_post_added',
      'board_created',
      'planet_level_up',
      'friend_board_created'
    )
  );

alter table public.notifications
  add column if not exists dedupe_key text,
  add column if not exists important boolean not null default false,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_error text;

create unique index if not exists idx_notifications_recipient_dedupe
  on public.notifications(recipient_clerk_user_id, dedupe_key)
  where dedupe_key is not null;
