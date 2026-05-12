update public.boards
set sharing_scope = 'owner_only'
where sharing_scope = 'selected_users';

alter table public.boards
  drop constraint if exists boards_sharing_scope_check;

alter table public.boards
  add constraint boards_sharing_scope_check
  check (sharing_scope in ('owner_only', 'followers', 'public'));

drop policy if exists "Public memory boards are readable" on public.boards;
create policy "Public memory boards are readable" on public.boards
  for select using (
    board_type = 'private_memory'
    and sharing_scope = 'public'
  );

drop policy if exists "Approved public memory board posts are readable" on public.memory_posts;
create policy "Approved public memory board posts are readable" on public.memory_posts
  for select using (
    status = 'approved'
    and exists (
      select 1 from public.boards
      where boards.id = memory_posts.board_id
        and boards.board_type = 'private_memory'
        and boards.sharing_scope = 'public'
    )
  );
