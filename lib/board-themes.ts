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

export const DEFAULT_BOARD_THEME: BoardThemeId = "paper";

export const BOARD_THEME_OPTIONS: BoardThemeId[] = [
  "paper",
  "sage",
  "sky",
  "rose",
  "lavender",
];

export const BOARD_THEMES: Record<BoardThemeId, BoardThemeConfig> = {
  paper: {
    id: "paper",
    label: "Warm Paper",
    description: "Soft kraft paper with warm brown details.",
    pageClassName: "theme-page-paper",
    boardClassName: "theme-board-paper",
    cardClassName: "theme-card-paper",
    previewClassName: "theme-preview-paper",
    navClassName: "theme-nav-paper",
    textClassName: "text-[#2f241b]",
    mutedTextClassName: "text-[#6f5b48]",
    accentClassName: "bg-[#c88f55]",
  },
  sage: {
    id: "sage",
    label: "Sage",
    description: "Calm green paper with mossy accents.",
    pageClassName: "theme-page-sage",
    boardClassName: "theme-board-sage",
    cardClassName: "theme-card-sage",
    previewClassName: "theme-preview-sage",
    navClassName: "theme-nav-sage",
    textClassName: "text-[#203025]",
    mutedTextClassName: "text-[#53634f]",
    accentClassName: "bg-[#6f8c62]",
  },
  sky: {
    id: "sky",
    label: "Mist Blue",
    description: "A pale blue album surface with ink-blue trim.",
    pageClassName: "theme-page-sky",
    boardClassName: "theme-board-sky",
    cardClassName: "theme-card-sky",
    previewClassName: "theme-preview-sky",
    navClassName: "theme-nav-sky",
    textClassName: "text-[#183040]",
    mutedTextClassName: "text-[#516a78]",
    accentClassName: "bg-[#6aa3bd]",
  },
  rose: {
    id: "rose",
    label: "Clay Rose",
    description: "A muted rose board with terracotta controls.",
    pageClassName: "theme-page-rose",
    boardClassName: "theme-board-rose",
    cardClassName: "theme-card-rose",
    previewClassName: "theme-preview-rose",
    navClassName: "theme-nav-rose",
    textClassName: "text-[#3a2522]",
    mutedTextClassName: "text-[#765650]",
    accentClassName: "bg-[#b76d62]",
  },
  lavender: {
    id: "lavender",
    label: "Lavender",
    description: "Quiet purple paper with soft plum accents.",
    pageClassName: "theme-page-lavender",
    boardClassName: "theme-board-lavender",
    cardClassName: "theme-card-lavender",
    previewClassName: "theme-preview-lavender",
    navClassName: "theme-nav-lavender",
    textClassName: "text-[#2f2940]",
    mutedTextClassName: "text-[#61576f]",
    accentClassName: "bg-[#8c75aa]",
  },
};

export function isBoardThemeId(value: unknown): value is BoardThemeId {
  return (
    value === "paper" ||
    value === "sage" ||
    value === "sky" ||
    value === "rose" ||
    value === "lavender"
  );
}

export function getBoardTheme(theme?: string | null) {
  return BOARD_THEMES[toBoardThemeId(theme)];
}

export function toBoardThemeId(theme?: string | null): BoardThemeId {
  if (isBoardThemeId(theme)) {
    return theme;
  }

  if (
    theme === "camo" ||
    theme === "nature" ||
    theme === "pale_green"
  ) {
    return "sage";
  }

  if (
    theme === "city" ||
    theme === "pale_blue" ||
    theme === "space" ||
    theme === "milky_way"
  ) {
    return "sky";
  }

  if (
    theme === "pale_pink" ||
    theme === "festival_night"
  ) {
    return "rose";
  }

  if (theme === "pale_lavender" || theme === "dark_minimal") {
    return "lavender";
  }

  return DEFAULT_BOARD_THEME;
}
