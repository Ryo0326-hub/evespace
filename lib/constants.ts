import type {
  BoardBackgroundTheme,
  FrameStyle,
  ModerationMode,
  StickerCategory,
  StickerOption,
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
  "space",
  "milky_way",
  "festival_night",
  "scrapbook",
  "pastel_sky",
  "dark_minimal",
];

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

export const stickerCategories: StickerCategory[] = [
  {
    id: "cosmic",
    name: "Cosmic",
    description: "Stars, moons, and small pieces of space.",
  },
  {
    id: "festival",
    name: "Festival",
    description: "Tickets, confetti, cameras, and event-day energy.",
  },
  {
    id: "cute",
    name: "Cute",
    description: "Soft clouds and flower-like scrapbook accents.",
  },
  {
    id: "love",
    name: "Love",
    description: "Hearts, ribbons, and keepsake details.",
  },
];

export const stickerOptions: StickerOption[] = [
  {
    id: "starburst",
    categoryId: "cosmic",
    name: "Starburst",
    description: "A bright star sticker for favorite memories.",
    label: "STAR",
    accentClassName: "from-cyan-100 via-white to-purple-100 text-slate-950",
  },
  {
    id: "moon",
    categoryId: "cosmic",
    name: "Moon",
    description: "A quiet moon sticker for night events.",
    label: "MOON",
    accentClassName: "from-slate-100 via-cyan-50 to-slate-300 text-slate-950",
  },
  {
    id: "planet",
    categoryId: "cosmic",
    name: "Planet",
    description: "A tiny planet for memories that feel like worlds.",
    label: "ORBIT",
    accentClassName: "from-indigo-200 via-purple-100 to-pink-200 text-indigo-950",
  },
  {
    id: "ticket",
    categoryId: "festival",
    name: "Ticket",
    description: "A ticket stub for event-day snapshots.",
    label: "PASS",
    accentClassName: "from-amber-100 via-orange-100 to-rose-100 text-orange-950",
  },
  {
    id: "confetti",
    categoryId: "festival",
    name: "Confetti",
    description: "A celebratory sticker for loud moments.",
    label: "POP",
    accentClassName: "from-pink-100 via-fuchsia-100 to-cyan-100 text-fuchsia-950",
  },
  {
    id: "camera",
    categoryId: "festival",
    name: "Camera",
    description: "A photo sticker for camera-roll highlights.",
    label: "SNAP",
    accentClassName: "from-slate-200 via-white to-cyan-100 text-slate-950",
  },
  {
    id: "cloud",
    categoryId: "cute",
    name: "Cloud",
    description: "A soft cloud sticker for dreamy notes.",
    label: "SOFT",
    accentClassName: "from-blue-100 via-white to-purple-100 text-blue-950",
  },
  {
    id: "flower",
    categoryId: "cute",
    name: "Flower",
    description: "A simple flower accent.",
    label: "BLOOM",
    accentClassName: "from-emerald-100 via-lime-50 to-cyan-100 text-emerald-950",
  },
  {
    id: "heart",
    categoryId: "love",
    name: "Heart",
    description: "A warm sticker for people and places you love.",
    label: "LOVE",
    accentClassName: "from-rose-100 via-pink-100 to-fuchsia-100 text-rose-950",
  },
  {
    id: "ribbon",
    categoryId: "love",
    name: "Ribbon",
    description: "A keepsake ribbon for milestone memories.",
    label: "GIFT",
    accentClassName: "from-purple-100 via-pink-100 to-amber-100 text-purple-950",
  },
];
