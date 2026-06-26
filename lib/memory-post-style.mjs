export const defaultMemoryPaperStyle = "mint";
export const defaultMemoryPenStyle = "classic_pen";

export const memoryPaperStyleOptions = [
  {
    id: "sky",
    label: "Sky",
    description: "Cool blue paper",
    className: "memory-paper-sky",
  },
  {
    id: "mint",
    label: "Mint",
    description: "Soft green paper",
    className: "memory-paper-mint",
  },
  {
    id: "lavender",
    label: "Lavender",
    description: "Pale purple paper",
    className: "memory-paper-lavender",
  },
];

export const memoryPenStyleOptions = [
  {
    id: "classic_pen",
    label: "Classic Pen",
    description: "Steady handwriting",
    className: "memory-pen-classic",
  },
  {
    id: "marker",
    label: "Marker",
    description: "Bold strokes",
    className: "memory-pen-marker",
  },
  {
    id: "fountain_pen",
    label: "Fountain Pen",
    description: "Elegant flow",
    className: "memory-pen-fountain",
  },
];

const memoryPaperStyleIds = new Set(
  memoryPaperStyleOptions.map((option) => option.id),
);
const memoryPenStyleIds = new Set(memoryPenStyleOptions.map((option) => option.id));

export function isMemoryPaperStyle(value) {
  return typeof value === "string" && memoryPaperStyleIds.has(value);
}

export function isMemoryPenStyle(value) {
  return typeof value === "string" && memoryPenStyleIds.has(value);
}

export function normalizeMemoryPaperStyle(value) {
  return isMemoryPaperStyle(value) ? value : defaultMemoryPaperStyle;
}

export function normalizeMemoryPenStyle(value) {
  return isMemoryPenStyle(value) ? value : defaultMemoryPenStyle;
}

export function normalizeMemoryPostStyleSelection(input = {}) {
  return {
    stickyNoteStyle: normalizeMemoryPaperStyle(input.stickyNoteStyle),
    memoryPenStyle: normalizeMemoryPenStyle(input.memoryPenStyle),
  };
}
