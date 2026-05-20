import type {
  FrameStyle,
  ModerationMode,
  StickyNoteStyle,
} from "@/types/evespace";
import {
  BOARD_THEME_OPTIONS,
  BOARD_THEMES,
} from "@/lib/board-themes";

export const galaxySize = {
  width: 10000,
  height: 10000,
};

export const initialCamera = {
  x: 5000,
  y: 5000,
  zoom: 0.15,
};

export const boardThemes = BOARD_THEME_OPTIONS;

export const memoryBoardThemeChoices = BOARD_THEME_OPTIONS;

export const memoryBoardBackgrounds = BOARD_THEMES;

export const frameStyles: FrameStyle[] = [
  "none",
  "polaroid",
  "soft_rounded",
  "film",
  "festival",
  "space_glow",
];

export const stickyNoteStyles: StickyNoteStyle[] = [
  "default",
  "yellow",
  "pink",
  "blue",
  "glass",
];

export const moderationModes: ModerationMode[] = ["pre_approval", "post_first"];

export const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export const maxUploadSizeBytes = 5 * 1024 * 1024;

export const memoryPostMediaBucket = "memory-post-media";

export const legacyMemoryPhotoBucket = "memory-photos";

export const memoryPostPageSize = 30;
