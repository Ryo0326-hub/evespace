alter table public.boards
  drop constraint if exists boards_board_background_theme_check;

update public.boards
set board_background_theme = case
  when board_background_theme in ('paper', 'sage', 'sky', 'rose', 'lavender') then board_background_theme
  when board_background_theme in ('camo', 'nature', 'pale_green') then 'sage'
  when board_background_theme in ('city', 'pale_blue', 'space', 'milky_way') then 'sky'
  when board_background_theme in ('pale_pink', 'festival_night') then 'rose'
  when board_background_theme in ('pale_lavender', 'dark_minimal') then 'lavender'
  else 'paper'
end;

alter table public.boards
  alter column board_background_theme set default 'paper';

alter table public.boards
  add constraint boards_board_background_theme_check
  check (board_background_theme in ('paper', 'sage', 'sky', 'rose', 'lavender'));
