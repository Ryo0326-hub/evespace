import type { MemoryPenStyle, StickyNoteStyle } from "@/types/evespace";

export type MemoryPaperStyle = Extract<
  StickyNoteStyle,
  "sky" | "mint" | "lavender"
>;

export type MemoryStyleOption<T extends string> = {
  id: T;
  label: string;
  description: string;
  className: string;
};

export const defaultMemoryPaperStyle: MemoryPaperStyle;
export const defaultMemoryPenStyle: MemoryPenStyle;
export const memoryPaperStyleOptions: MemoryStyleOption<MemoryPaperStyle>[];
export const memoryPenStyleOptions: MemoryStyleOption<MemoryPenStyle>[];

export function isMemoryPaperStyle(value: unknown): value is MemoryPaperStyle;
export function isMemoryPenStyle(value: unknown): value is MemoryPenStyle;
export function normalizeMemoryPaperStyle(value: unknown): MemoryPaperStyle;
export function normalizeMemoryPenStyle(value: unknown): MemoryPenStyle;
export function normalizeMemoryPostStyleSelection(input?: {
  stickyNoteStyle?: unknown;
  memoryPenStyle?: unknown;
}): {
  stickyNoteStyle: MemoryPaperStyle;
  memoryPenStyle: MemoryPenStyle;
};
