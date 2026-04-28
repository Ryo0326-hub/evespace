/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { DraggableSticker } from "@/components/board/DraggableSticker";
import { StickerVisual } from "@/components/board/StickerVisual";
import { cn, formatDate } from "@/lib/utils";
import type { MemoryPost, PlacedSticker, StickerPlacement } from "@/types/evespace";

const placementClass: Record<StickerPlacement, string> = {
  top_left: "left-3 top-3",
  top_right: "right-3 top-3",
  bottom_left: "bottom-3 left-3",
  bottom_right: "bottom-3 right-3",
};

export function MemoryCard({
  post,
  stickers = [],
  selected = false,
  onSelect,
  onStickerMove,
  onStickerDelete,
}: {
  post: MemoryPost;
  stickers?: PlacedSticker[];
  selected?: boolean;
  onSelect?: (postId: string) => void;
  onStickerMove?: (stickerId: string, x: number, y: number) => void;
  onStickerDelete?: (stickerId: string) => void;
}) {
  const stickerLayerRef = useRef<HTMLDivElement | null>(null);

  return (
    <article className="mx-auto w-full max-w-[26rem] break-inside-avoid">
      <div
        data-memory-card-id={post.id}
        onClick={() => onSelect?.(post.id)}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-black bg-white p-3 text-black shadow-sm transition sm:p-4",
          selected ? "ring-2 ring-cyan-200/80 ring-offset-2 ring-offset-white" : "",
        )}
      >
        <div
          ref={stickerLayerRef}
          className="pointer-events-none absolute inset-[3px] z-30 overflow-hidden rounded-[calc(1rem-3px)]"
          data-sticker-layer-for={post.id}
        >
          {stickers.map((sticker) => (
            <div className="pointer-events-auto" key={sticker.id}>
              <DraggableSticker
                containerRef={stickerLayerRef}
                onDelete={onStickerDelete}
                onMove={onStickerMove}
                sticker={sticker}
              />
            </div>
          ))}
        </div>

        <header className="relative z-10 flex min-h-12 items-center justify-between gap-3 px-1 pb-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
              {post.authorDisplayName || "Anonymous"}
            </p>
            <time className="text-xs text-slate-500">{formatDate(post.createdAt)}</time>
          </div>
          <span className="rounded-full border border-black px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-black">
            Memory
          </span>
        </header>

        <div className="relative z-10 overflow-hidden rounded-xl border border-black bg-white">
          <img
            src={post.imageUrl}
            alt={post.caption ?? "Event memory"}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
          {post.stickers.map((sticker) => (
            <div
              className={cn("pointer-events-none absolute", placementClass[sticker.placement])}
              key={`${sticker.stickerId}-${sticker.placement}`}
            >
              <StickerVisual size={62} stickerId={sticker.stickerId} />
            </div>
          ))}
        </div>

        <div className="relative z-10 px-1 pb-2 pt-4">
          {post.caption ? (
            <p className="text-sm leading-6 text-black">
              {post.caption}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
