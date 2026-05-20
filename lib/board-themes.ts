import type { BoardThemeId } from "@/types/evespace";

export type BoardThemeConfig = {
  id: BoardThemeId;
  label: string;
  description: string;
  pageClassName: string;
  boardClassName: string;
  cardClassName: string;
  previewClassName: string;
  navClassName: string;
  textClassName: string;
  mutedTextClassName: string;
  accentClassName: string;
};

export const DEFAULT_BOARD_THEME: BoardThemeId = "plain";

export const BOARD_THEME_OPTIONS: BoardThemeId[] = [
  "plain",
  "camo",
  "pastel",
  "city",
];

export const BOARD_THEMES: Record<BoardThemeId, BoardThemeConfig> = {
  plain: {
    id: "plain",
    label: "Plain / Simple",
    description: "A clean soft-blue canvas.",
    pageClassName: "theme-page-plain",
    boardClassName: "theme-board-plain",
    cardClassName: "theme-card-plain",
    previewClassName: "theme-preview-plain",
    navClassName: "theme-nav-plain",
    textClassName: "text-slate-950",
    mutedTextClassName: "text-slate-700",
    accentClassName: "bg-[#bbd7ff]",
  },
  camo: {
    id: "camo",
    label: "Camo",
    description: "Soft outdoor camo blobs.",
    pageClassName: "theme-page-camo",
    boardClassName: "theme-board-camo",
    cardClassName: "theme-card-camo",
    previewClassName: "theme-preview-camo",
    navClassName: "theme-nav-camo",
    textClassName: "text-slate-950",
    mutedTextClassName: "text-slate-800",
    accentClassName: "bg-[#b7c9a8]",
  },
  pastel: {
    id: "pastel",
    label: "Pastel",
    description: "The original EveSpace pastel gradient.",
    pageClassName: "theme-page-pastel",
    boardClassName: "theme-board-pastel",
    cardClassName: "theme-card-pastel",
    previewClassName: "theme-preview-pastel",
    navClassName: "theme-nav-pastel",
    textClassName: "text-slate-950",
    mutedTextClassName: "text-slate-700",
    accentClassName: "bg-[#fff4a8]",
  },
  city: {
    id: "city",
    label: "City",
    description: "A soft urban night skyline style.",
    pageClassName: "theme-page-city",
    boardClassName: "theme-board-city",
    cardClassName: "theme-card-city",
    previewClassName: "theme-preview-city",
    navClassName: "theme-nav-city",
    textClassName: "text-white",
    mutedTextClassName: "text-blue-100/90",
    accentClassName: "bg-[#fde68a]",
  },
};

export function isBoardThemeId(value: unknown): value is BoardThemeId {
  return value === "plain" || value === "camo" || value === "pastel" || value === "city";
}

export function getBoardTheme(theme?: string | null) {
  return BOARD_THEMES[toBoardThemeId(theme)];
}

export function toBoardThemeId(theme?: string | null): BoardThemeId {
  if (isBoardThemeId(theme)) {
    return theme;
  }

  if (
    theme === "soft_cream" ||
    theme === "pale_blue" ||
    theme === "pale_pink" ||
    theme === "pale_green" ||
    theme === "pale_lavender" ||
    theme === "space" ||
    theme === "milky_way" ||
    theme === "festival_night" ||
    theme === "scrapbook" ||
    theme === "pastel_sky" ||
    theme === "dark_minimal"
  ) {
    return DEFAULT_BOARD_THEME;
  }

  return DEFAULT_BOARD_THEME;
}
