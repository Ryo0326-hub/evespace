alter table public.boards
  add column if not exists board_background_theme text not null default 'plain';

alter table public.boards
  alter column board_background_theme set default 'plain';

alter table public.boards
  drop constraint if exists boards_board_background_theme_check;

update public.boards
set board_background_theme = case
  when board_background_theme in ('plain', 'camo', 'pastel', 'city') then board_background_theme
  when board_background_theme in (
    'soft_cream',
    'pale_blue',
    'pale_pink',
    'pale_green',
    'pale_lavender',
    'space',
    'milky_way',
    'festival_night',
    'scrapbook',
    'pastel_sky',
    'dark_minimal'
  ) then 'pastel'
  else 'plain'
end;

alter table public.boards
  add constraint boards_board_background_theme_check
  check (board_background_theme in ('plain', 'camo', 'pastel', 'city'));
