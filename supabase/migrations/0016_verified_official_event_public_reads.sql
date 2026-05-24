drop policy if exists "Public official boards are readable" on public.boards;
drop policy if exists "Verified official boards are readable" on public.boards;
create policy "Verified official boards are readable" on public.boards
  for select using (
    board_type = 'official_event'
    and visibility = 'public'
    and official_sharing_scope = 'public'
    and verification_status = 'verified'
  );

drop policy if exists "Public official board schedules are readable" on public.board_schedules;
drop policy if exists "Verified official board schedules are readable" on public.board_schedules;
create policy "Verified official board schedules are readable" on public.board_schedules
  for select using (
    exists (
      select 1 from public.boards
      where boards.id = board_schedules.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.official_sharing_scope = 'public'
        and boards.verification_status = 'verified'
    )
  );

drop policy if exists "Public official event goods are readable" on public.official_event_goods_services;
drop policy if exists "Verified official event goods are readable" on public.official_event_goods_services;
create policy "Verified official event goods are readable" on public.official_event_goods_services
  for select using (
    exists (
      select 1 from public.boards
      where boards.id = official_event_goods_services.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.official_sharing_scope = 'public'
        and boards.verification_status = 'verified'
    )
  );

drop policy if exists "Public official event sponsors are readable" on public.official_event_sponsors;
drop policy if exists "Verified official event sponsors are readable" on public.official_event_sponsors;
create policy "Verified official event sponsors are readable" on public.official_event_sponsors
  for select using (
    exists (
      select 1 from public.boards
      where boards.id = official_event_sponsors.board_id
        and boards.board_type = 'official_event'
        and boards.visibility = 'public'
        and boards.official_sharing_scope = 'public'
        and boards.verification_status = 'verified'
    )
  );

drop policy if exists "Approved public board memory posts are readable" on public.memory_posts;
drop policy if exists "Approved public memory board posts are readable" on public.memory_posts;
create policy "Approved public board memory posts are readable" on public.memory_posts
  for select using (
    status = 'approved'
    and exists (
      select 1 from public.boards
      where boards.id = memory_posts.board_id
        and (
          (
            boards.board_type = 'official_event'
            and boards.visibility = 'public'
            and boards.official_sharing_scope = 'public'
            and boards.verification_status = 'verified'
          )
          or (
            boards.board_type = 'private_memory'
            and boards.sharing_scope = 'public'
          )
        )
    )
  );

drop policy if exists "Approved memory post media is readable" on public.memory_post_media;
drop policy if exists "Approved public memory post media is readable" on public.memory_post_media;
create policy "Approved memory post media is readable" on public.memory_post_media
  for select using (
    exists (
      select 1 from public.memory_posts
      left join public.boards on boards.id = memory_posts.board_id
      where memory_posts.id = memory_post_media.post_id
        and memory_posts.status = 'approved'
        and (
          (
            boards.board_type = 'official_event'
            and boards.visibility = 'public'
            and boards.official_sharing_scope = 'public'
            and boards.verification_status = 'verified'
          )
          or (
            boards.board_type = 'private_memory'
            and boards.sharing_scope = 'public'
          )
        )
    )
  );

drop policy if exists "Approved memory post stickers are readable" on public.memory_post_stickers;
drop policy if exists "Approved public memory post stickers are readable" on public.memory_post_stickers;
create policy "Approved memory post stickers are readable" on public.memory_post_stickers
  for select using (
    exists (
      select 1 from public.memory_posts
      left join public.boards on boards.id = memory_posts.board_id
      where memory_posts.id = memory_post_stickers.post_id
        and memory_posts.status = 'approved'
        and (
          (
            boards.board_type = 'official_event'
            and boards.visibility = 'public'
            and boards.official_sharing_scope = 'public'
            and boards.verification_status = 'verified'
          )
          or (
            boards.board_type = 'private_memory'
            and boards.sharing_scope = 'public'
          )
        )
    )
  );
