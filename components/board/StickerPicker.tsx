"use client";

import { useMemo, useState } from "react";
import { StickerVisual } from "@/components/board/StickerVisual";
import { STICKER_CATEGORIES, STICKERS } from "@/lib/stickers/sticker-registry";
import { cn } from "@/lib/utils";
import type { StickerCategory, StickerPlacement, StickerSelection } from "@/types/evespace";

const placementOptions: Array<{ value: StickerPlacement; label: string }> = [
  { value: "top_left", label: "Top left" },
  { value: "top_right", label: "Top right" },
  { value: "bottom_left", label: "Bottom left" },
  { value: "bottom_right", label: "Bottom right" },
];

export function StickerPicker({
  value,
  onChange,
}: {
  value: StickerSelection[];
  onChange: (stickers: StickerSelection[]) => void;
}) {
  const [category, setCategory] = useState<StickerCategory>("pixel");
  const visibleStickers = useMemo(
    () => STICKERS.filter((sticker) => sticker.category === category),
    [category],
  );
  const usedPlacements = new Set(value.map((sticker) => sticker.placement));

  function toggleSticker(stickerId: string) {
    const existing = value.find((sticker) => sticker.stickerId === stickerId);
    if (existing) {
      onChange(value.filter((sticker) => sticker.stickerId !== stickerId));
      return;
    }

    if (value.length >= 3) {
      return;
    }

    const placement =
      placementOptions.find((option) => !usedPlacements.has(option.value))?.value ??
      "top_right";
    onChange([...value, { stickerId, placement }]);
  }

  function updatePlacement(stickerId: string, placement: StickerPlacement) {
    if (
      value.some(
        (sticker) =>
          sticker.stickerId !== stickerId && sticker.placement === placement,
      )
    ) {
      return;
    }

    onChange(
      value.map((sticker) =>
        sticker.stickerId === stickerId ? { ...sticker, placement } : sticker,
      ),
    );
  }

  return (
    <div className="grid gap-4">
      <input name="stickers" type="hidden" value={JSON.stringify(value)} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STICKER_CATEGORIES.map((item) => (
          <button
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
              item.id === category
                ? "border-cyan-200 bg-cyan-200 text-slate-950"
                : "border-white/10 bg-white/10 text-slate-200",
            )}
            key={item.id}
            onClick={() => setCategory(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleStickers.map((sticker) => {
          const selected = value.some((item) => item.stickerId === sticker.id);

          return (
            <button
              className={cn(
                "rounded-2xl border p-3 text-center transition hover:-translate-y-0.5",
                selected
                  ? "border-cyan-200 bg-cyan-200/15"
                  : "border-white/10 bg-white/[0.06]",
              )}
              key={sticker.id}
              onClick={() => toggleSticker(sticker.id)}
              type="button"
            >
              <div className="flex justify-center">
                <StickerVisual size={58} stickerId={sticker.id} />
              </div>
              <p className="mt-2 text-xs font-semibold text-white">{sticker.name}</p>
            </button>
          );
        })}
      </div>

      {value.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Selected stickers
          </p>
          {value.map((selection) => {
            const sticker = STICKERS.find((item) => item.id === selection.stickerId);

            return (
              <label
                className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm text-slate-200 sm:grid-cols-[1fr_auto] sm:items-center"
                key={selection.stickerId}
              >
                <span>{sticker?.name ?? selection.stickerId}</span>
                <select
                  className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                  onChange={(event) =>
                    updatePlacement(
                      selection.stickerId,
                      event.target.value as StickerPlacement,
                    )
                  }
                  value={selection.placement}
                >
                  {placementOptions.map((option) => (
                    <option
                      disabled={
                        usedPlacements.has(option.value) &&
                        option.value !== selection.placement
                      }
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Choose up to three stickers.</p>
      )}
    </div>
  );
}
