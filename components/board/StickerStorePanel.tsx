"use client";

import { useMemo, useRef, useState } from "react";
import { StickerVisual } from "@/components/board/StickerVisual";
import { STICKER_CATEGORIES, STICKERS } from "@/lib/stickers/sticker-registry";
import { cn } from "@/lib/utils";
import type { StickerCategory, StickerId } from "@/types/evespace";

type PanelPosition = {
  x: number;
  y: number;
};

export function StickerStorePanel({
  open,
  onClose,
  onAddSticker,
  onStartStickerDrag,
  selectedStickerCount,
  maxStickersPerPost,
}: {
  open: boolean;
  onClose: () => void;
  onAddSticker: (stickerId: StickerId) => void;
  onStartStickerDrag: (
    event: React.PointerEvent<HTMLDivElement>,
    stickerId: StickerId,
  ) => void;
  selectedStickerCount: number;
  maxStickersPerPost: number;
}) {
  const [categoryId, setCategoryId] = useState<StickerCategory>("pixel");
  const [query, setQuery] = useState("");
  const [panelOffset, setPanelOffset] = useState<PanelPosition>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement | null>(null);

  const visibleStickers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return STICKERS.filter((sticker) => {
      const matchesCategory = sticker.category === categoryId;
      const matchesQuery = [sticker.name, sticker.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

      return matchesCategory && (!normalizedQuery || matchesQuery);
    });
  }, [categoryId, query]);

  if (!open) {
    return null;
  }

  function startPanelDrag(event: React.PointerEvent<HTMLDivElement>) {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }
    const panelElement = panel;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const rect = panel.getBoundingClientRect();
    const origin = {
      x: event.clientX,
      y: event.clientY,
    };
    const grabOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const padding = 8;
    let didStartDrag = false;
    const originOffset = panelOffset;
    let latestOffset = originOffset;

    function applyOffset(position: PanelPosition) {
      panelElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    }

    function movePanel(moveEvent: PointerEvent) {
      moveEvent.preventDefault();

      const delta =
        Math.abs(moveEvent.clientX - origin.x) +
        Math.abs(moveEvent.clientY - origin.y);

      if (!didStartDrag && delta < 4) {
        return;
      }

      didStartDrag = true;

      const nextLeft = Math.min(
        Math.max(moveEvent.clientX - grabOffset.x, padding),
        Math.max(padding, window.innerWidth - rect.width - padding),
      );
      const nextTop = Math.min(
        Math.max(moveEvent.clientY - grabOffset.y, padding),
        Math.max(padding, window.innerHeight - rect.height - padding),
      );

      latestOffset = {
        x: originOffset.x + nextLeft - rect.left,
        y: originOffset.y + nextTop - rect.top,
      };

      applyOffset(latestOffset);
    }

    function stopPanelDrag() {
      window.removeEventListener("pointermove", movePanel);
      window.removeEventListener("pointerup", stopPanelDrag);
      window.removeEventListener("pointercancel", stopPanelDrag);

      if (didStartDrag) {
        setPanelOffset(latestOffset);
      }
    }

    window.addEventListener("pointermove", movePanel);
    window.addEventListener("pointerup", stopPanelDrag);
    window.addEventListener("pointercancel", stopPanelDrag);
  }

  return (
    <div
      className={cn(
        "fixed z-[70] w-[min(20rem,calc(100vw-1.5rem))] sm:w-80",
        "right-3 top-[7.25rem] sm:right-6 sm:top-[7.5rem]",
      )}
      ref={panelRef}
      style={{
        transform: `translate3d(${panelOffset.x}px, ${panelOffset.y}px, 0)`,
      }}
    >
      <section className="max-h-[35vh] overflow-hidden rounded-[1.35rem] border border-black/10 bg-white/95 shadow-[0_18px_54px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:max-h-[28rem] sm:rounded-[1.5rem]">
        <header className="grid gap-3 border-b border-black/10 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div
              aria-label="Drag sticker store"
              className="min-w-0 flex-1 touch-none cursor-grab rounded-2xl border border-black/10 bg-black/[0.03] px-3 py-2 active:cursor-grabbing"
              onPointerDown={startPanelDrag}
              role="button"
              tabIndex={0}
            >
              <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-black">
                Sticker Store
              </p>
              <p
                className={cn(
                  "mt-1 text-[0.68rem] font-bold",
                  selectedStickerCount >= maxStickersPerPost
                    ? "text-amber-700"
                    : "text-slate-700",
                )}
              >
                {selectedStickerCount >= maxStickersPerPost
                  ? "Limit reached: delete one to add more"
                  : `${selectedStickerCount}/${maxStickersPerPost} on selected post`}
              </p>
              <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-slate-600">
                Drag this header to move
              </p>
            </div>
            <button
              className="shrink-0 rounded-full border border-black/20 bg-black px-3 py-1.5 text-[0.68rem] font-black text-white"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </header>

        <div className="max-h-[calc(35vh-3.2rem)] overflow-y-auto p-3 pb-5 sm:max-h-[calc(28rem-3.2rem)]">
          <label className="grid gap-1.5 text-sm text-black">
            <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-black">
              Search
            </span>
            <input
              className="min-h-9 rounded-xl border border-black/20 bg-white px-3 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500 focus:border-black"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stickers"
              type="search"
              value={query}
            />
          </label>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {STICKER_CATEGORIES.map((category) => (
              <button
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold transition",
                  category.id === categoryId
                    ? "border-black bg-black text-white"
                    : "border-black/20 bg-white text-black",
                )}
                key={category.id}
                onClick={() => setCategoryId(category.id)}
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {visibleStickers.map((sticker) => (
              <button
                className="touch-none rounded-[1rem] p-2 text-center transition hover:bg-black/5"
                key={sticker.id}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onAddSticker(sticker.id);
                  }
                }}
                type="button"
              >
                <div
                  className="mx-auto flex size-[50px] touch-none cursor-grab items-center justify-center active:cursor-grabbing"
                  data-sticker-preview
                  onPointerDown={(event) => onStartStickerDrag(event, sticker.id)}
                >
                  <StickerVisual size={50} stickerId={sticker.id} />
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-black text-black">
                  {sticker.name}
                </p>
              </button>
            ))}
          </div>

          {visibleStickers.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-black/30 px-4 py-6 text-center text-sm font-semibold text-black">
              No demo stickers matched this search.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
