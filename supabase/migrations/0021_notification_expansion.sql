alter table public.notifications
  drop constraint if exists notifications_notification_type_check;

alter table public.notifications
  add constraint notifications_notification_type_check
  check (
    notification_type in (
      'followed_you',
      'you_followed',
      'follow_requested',
      'follow_request_sent',
      'follow_request_accepted',
      'memory_post_added',
      'memory_post_commented',
      'comment_replied',
      'memory_post_moderated',
      'event_verification_updated',
      'board_created',
      'planet_level_up',
      'friend_board_created'
    )
  );

create index if not exists idx_notifications_clerk_unread_created
  on public.notifications(recipient_clerk_user_id, created_at desc)
  where read_at is null;
