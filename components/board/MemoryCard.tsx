/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import { DraggableSticker } from "@/components/board/DraggableSticker";
import { cn, formatDate } from "@/lib/utils";
import type { MemoryPost, PlacedSticker } from "@/types/evespace";

const frameClass = {
  none: "border-white/10 bg-white/[0.04]",
  polaroid: "border-white bg-white p-3 pb-10 text-slate-950",
  soft_rounded: "border-white/15 bg-white/[0.08]",
  film: "border-slate-900 bg-slate-950 ring-4 ring-slate-900",
  festival: "border-pink-200/50 bg-pink-200/10",
  space_glow: "border-cyan-200/30 bg-cyan-200/10 shadow-cyan-300/20",
};

const noteClass = {
  default: "bg-white/10 text-slate-100",
  yellow: "bg-yellow-200 text-slate-950",
  pink: "bg-pink-200 text-slate-950",
  blue: "bg-cyan-200 text-slate-950",
  glass: "border border-white/15 bg-white/10 text-slate-100 backdrop-blur",
};

export function MemoryCard({
  post,
  stickers = [],
  selected = false,
  onSelect,
  onStickerMove,
}: {
  post: MemoryPost;
  stickers?: PlacedSticker[];
  selected?: boolean;
  onSelect?: (postId: string) => void;
  onStickerMove?: (stickerId: string, x: number, y: number) => void;
}) {
  const stickerLayerRef = useRef<HTMLDivElement | null>(null);

  return (
    <article
      className="mx-auto w-full max-w-[26rem] break-inside-avoid"
      style={{ transform: `rotate(${post.rotation}deg)` }}
    >
      <div
        data-memory-card-id={post.id}
        onClick={() => onSelect?.(post.id)}
        className={cn(
          "relative overflow-hidden rounded-[1.8rem] border p-3 shadow-2xl shadow-black/25 transition sm:p-4",
          selected ? "ring-2 ring-cyan-200/80 ring-offset-2 ring-offset-slate-950" : "",
          frameClass[post.frameStyle],
        )}
      >
        <div
          ref={stickerLayerRef}
          className="pointer-events-none absolute inset-0 z-20"
          data-sticker-layer-for={post.id}
        >
          {stickers.map((sticker) => (
            <div className="pointer-events-auto" key={sticker.id}>
              <DraggableSticker
                containerRef={stickerLayerRef}
                onMove={onStickerMove}
                sticker={sticker}
              />
            </div>
          ))}
        </div>

        <header className="relative z-10 flex min-h-12 items-center justify-between gap-3 px-1 pb-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {post.authorDisplayName || "Anonymous"}
            </p>
            <time className="text-xs text-slate-500">{formatDate(post.createdAt)}</time>
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-300">
            Memory
          </span>
        </header>

        <div className="relative z-10 rounded-[1.45rem] border border-white/10 bg-slate-950/20 p-2 shadow-inner shadow-black/20">
          <img
            src={post.imageUrl}
            alt={post.caption ?? "Event memory"}
            className="aspect-[4/3] w-full rounded-[1.1rem] object-cover"
            loading="lazy"
          />
        </div>

        <div className="relative z-10 px-1 pb-2 pt-4">
          {post.caption ? (
            <p
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                noteClass[post.stickyNoteStyle],
              )}
            >
              {post.caption}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
