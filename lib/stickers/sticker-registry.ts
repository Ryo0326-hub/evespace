import type { Sticker, StickerCategory, StickerId } from "@/types/evespace";

export const STICKER_CATEGORIES: Array<{ id: StickerCategory; label: string }> = [
  { id: "pixel", label: "Pixel" },
  { id: "doodle", label: "Doodle" },
  { id: "clay", label: "Clay" },
];

export const STICKERS: Sticker[] = [
  {
    id: "pixel-butterfly",
    name: "Pixel Butterfly",
    category: "pixel",
    src: "/stickers/pixel-butterfly.png",
  },
  {
    id: "pixel-dolphin",
    name: "Pixel Dolphin",
    category: "pixel",
    src: "/stickers/pixel-dolphin.png",
  },
  {
    id: "pixel-egg",
    name: "Pixel Egg",
    category: "pixel",
    src: "/stickers/pixel-egg.png",
  },
  {
    id: "doodle-camera",
    name: "Doodle Camera",
    category: "doodle",
    src: "/stickers/doodle-camera.png",
  },
  {
    id: "doodle-chocolate",
    name: "Doodle Chocolate",
    category: "doodle",
    src: "/stickers/doodle-chocolate.png",
  },
  {
    id: "clay-carrot",
    name: "Clay Carrot",
    category: "clay",
    src: "/stickers/clay-carrot.png",
  },
  {
    id: "clay-duck",
    name: "Clay Duck",
    category: "clay",
    src: "/stickers/clay-duck.png",
  },
];

export function getSticker(stickerId: StickerId) {
  return STICKERS.find((sticker) => sticker.id === stickerId) ?? null;
}

const stickerIdSet = new Set(STICKERS.map((sticker) => sticker.id));

export function isRegisteredStickerId(id: string): id is StickerId {
  return stickerIdSet.has(id);
}
