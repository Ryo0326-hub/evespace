"use client";

import { useMemo, useState } from "react";
import { StickerVisual } from "@/components/board/StickerVisual";
import { stickerCategories, stickerOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StickerCategoryId, StickerId } from "@/types/evespace";

export function StickerStorePanel({
  open,
  onClose,
  onAddSticker,
  onStartStickerDrag,
}: {
  open: boolean;
  onClose: () => void;
  onAddSticker: (stickerId: StickerId) => void;
  onStartStickerDrag: (
    event: React.PointerEvent<HTMLButtonElement>,
    stickerId: StickerId,
  ) => void;
}) {
  const [categoryId, setCategoryId] = useState<StickerCategoryId>("cosmic");
  const [query, setQuery] = useState("");

  const visibleStickers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stickerOptions.filter((sticker) => {
      const matchesCategory = sticker.categoryId === categoryId;
      const matchesQuery = [sticker.name, sticker.description, sticker.label]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

      return matchesCategory && (!normalizedQuery || matchesQuery);
    });
  }, [categoryId, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:w-72 sm:px-0 sm:pb-0">
      <section className="max-h-[50vh] overflow-hidden rounded-t-[1.5rem] border border-white/15 bg-slate-950/95 shadow-[0_-18px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:max-h-[28rem] sm:rounded-[1.5rem] sm:shadow-[0_18px_54px_rgba(0,0,0,0.34)]">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Sticker Store
            </p>
          </div>
          <button
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[0.68rem] font-semibold text-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="max-h-[calc(50vh-3.2rem)] overflow-y-auto p-3 sm:max-h-[calc(28rem-3.2rem)]">
          <label className="grid gap-1.5 text-sm text-slate-200">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Search
            </span>
            <input
              className="min-h-9 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-200/60"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stickers"
              type="search"
              value={query}
            />
          </label>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {stickerCategories.map((category) => (
              <button
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold transition",
                  category.id === categoryId
                    ? "border-cyan-200 bg-cyan-200 text-slate-950"
                    : "border-white/10 bg-white/10 text-slate-200",
                )}
                key={category.id}
                onClick={() => setCategoryId(category.id)}
                type="button"
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {visibleStickers.map((sticker) => (
              <button
                className="touch-none rounded-[1rem] border border-white/10 bg-white/[0.06] p-2 text-center transition hover:-translate-y-0.5 hover:bg-white/10"
                key={sticker.id}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onAddSticker(sticker.id);
                  }
                }}
                onPointerDown={(event) => onStartStickerDrag(event, sticker.id)}
                type="button"
              >
                <div className="flex justify-center">
                  <StickerVisual size={50} stickerId={sticker.id} />
                </div>
                <p className="mt-2 text-xs font-semibold text-white">{sticker.name}</p>
              </button>
            ))}
          </div>

          {visibleStickers.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-400">
              No demo stickers matched this search.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
