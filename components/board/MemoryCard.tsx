/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteOwnMemoryPostAction } from "@/app/actions/memories";
import { DraggableSticker } from "@/components/board/DraggableSticker";
import { MemoryComments } from "@/components/board/MemoryComments";
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
  canEditStickers = false,
  canDeletePost = false,
  onSelect,
  onStickerMove,
  onStickerDelete,
  returnPath = "",
  viewerSignedIn = false,
}: {
  post: MemoryPost;
  stickers?: PlacedSticker[];
  selected?: boolean;
  canEditStickers?: boolean;
  canDeletePost?: boolean;
  onSelect?: (postId: string) => void;
  onStickerMove?: (stickerId: string, x: number, y: number) => void;
  onStickerDelete?: (stickerId: string) => void;
  returnPath?: string;
  viewerSignedIn?: boolean;
}) {
  const stickerLayerRef = useRef<HTMLDivElement | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteAction = deleteOwnMemoryPostAction.bind(null, post.id, returnPath);

  return (
    <article className="mx-auto w-full min-w-0 max-w-[25.5rem] break-inside-avoid">
      <div
        data-memory-card-id={post.id}
        onClick={() => onSelect?.(post.id)}
        className={cn(
          "memory-post-card relative min-w-0 max-w-full overflow-hidden rounded-[1.7rem] border-2 border-dotted border-slate-300 bg-[#fffaf0] p-3 text-black transition sm:p-4",
          selected ? "ring-4 ring-pink-200/85 ring-offset-2 ring-offset-[#fffaf0]" : "",
        )}
      >
        <header className="relative z-10 flex min-h-7 items-center justify-between gap-2 border-b-2 border-dashed border-black/15 px-1 pb-2">
          <time className="min-w-0 text-xs font-bold text-slate-500">
            {formatDate(post.createdAt)}
          </time>
          {canDeletePost ? (
            <button
              aria-label="Delete memory"
              className="memory-board-danger-button inline-flex size-8 shrink-0 items-center justify-center rounded-full text-base font-black leading-none transition"
              onClick={(event) => {
                event.stopPropagation();
                setConfirmDeleteOpen(true);
              }}
              type="button"
            >
              x
            </button>
          ) : null}
        </header>

        {confirmDeleteOpen ? (
          <div
            className="absolute inset-0 z-50 grid place-items-center bg-black/55 px-4 backdrop-blur-sm"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm memory deletion"
          >
            <div className="memory-board-confirm-dialog w-full max-w-[18rem] rounded-[1.5rem] border-[3px] p-4 text-center">
              <p className="text-sm font-black">Delete this memory?</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">
                This removes the post from the board.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="memory-board-soft-button inline-flex min-h-10 items-center justify-center rounded-full px-4 text-xs font-black transition"
                  onClick={() => setConfirmDeleteOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <form action={deleteAction}>
                  <DeleteSubmitButton />
                </form>
              </div>
            </div>
          </div>
        ) : null}

        <div className="memory-post-media relative z-10 mt-2 overflow-hidden rounded-[1.15rem] border-2 border-slate-300 bg-white">
          <img
            src={post.imageUrl}
            alt={post.caption ?? "Event memory"}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
          <div
            ref={stickerLayerRef}
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
            data-sticker-layer-for={post.id}
          >
            {stickers.map((sticker) => (
              <div
                className={canEditStickers ? "pointer-events-auto" : "pointer-events-none"}
                key={sticker.id}
              >
                <DraggableSticker
                  containerRef={stickerLayerRef}
                  onDelete={canEditStickers ? onStickerDelete : undefined}
                  onMove={canEditStickers ? onStickerMove : undefined}
                  sticker={sticker}
                />
              </div>
            ))}
          </div>
          {post.stickers.map((sticker) => (
            <div
              className={cn(
                "pointer-events-none absolute z-30",
                placementClass[sticker.placement],
              )}
              key={`${sticker.stickerId}-${sticker.placement}`}
            >
              <StickerVisual size={62} stickerId={sticker.stickerId} />
            </div>
          ))}
        </div>

        <div className="relative z-10 px-1 pb-1 pt-2">
          {post.caption ? (
            <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-black [overflow-wrap:anywhere]">
              {post.caption}
            </p>
          ) : null}
        </div>

        {returnPath ? (
          <MemoryComments
            boardId={post.boardId ?? post.eventId}
            comments={post.comments}
            postId={post.id}
            returnPath={returnPath}
            viewerSignedIn={viewerSignedIn}
          />
        ) : null}
      </div>
    </article>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="memory-board-danger-button inline-flex min-h-10 w-full items-center justify-center rounded-full px-4 text-xs font-black transition disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Deleting..." : "Confirm"}
    </button>
  );
}
