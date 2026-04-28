import type {
  BoardBackgroundTheme,
  FrameStyle,
  ModerationMode,
  StickyNoteStyle,
} from "@/types/evespace";

export const galaxySize = {
  width: 10000,
  height: 10000,
};

export const initialCamera = {
  x: 5000,
  y: 5000,
  zoom: 0.15,
};

export const boardThemes: BoardBackgroundTheme[] = [
  "soft_cream",
  "pale_blue",
  "pale_pink",
  "pale_green",
  "pale_lavender",
];

export const boardBackgrounds: Record<
  BoardBackgroundTheme,
  { label: string; className: string; swatchClassName: string }
> = {
  soft_cream: {
    label: "Soft Cream",
    className: "bg-[#FFF8E7]",
    swatchClassName: "bg-[#FFF8E7]",
  },
  pale_blue: {
    label: "Pale Blue",
    className: "bg-[#EAF6FF]",
    swatchClassName: "bg-[#EAF6FF]",
  },
  pale_pink: {
    label: "Pale Pink",
    className: "bg-[#FFF0F5]",
    swatchClassName: "bg-[#FFF0F5]",
  },
  pale_green: {
    label: "Pale Green",
    className: "bg-[#EEFBEF]",
    swatchClassName: "bg-[#EEFBEF]",
  },
  pale_lavender: {
    label: "Pale Lavender",
    className: "bg-[#F3EEFF]",
    swatchClassName: "bg-[#F3EEFF]",
  },
};

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
