/* eslint-disable @next/next/no-img-element */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteOwnMemoryPostAction } from "@/app/actions/memories";
import { DraggableSticker } from "@/components/board/DraggableSticker";
import { MemoryComments } from "@/components/board/MemoryComments";
import { StickerVisual } from "@/components/board/StickerVisual";
import { cn, formatDate } from "@/lib/utils";
import type {
  MemoryPenStyle,
  MemoryPost,
  PlacedSticker,
  StickerPlacement,
  StickyNoteStyle,
} from "@/types/evespace";

const placementClass: Record<StickerPlacement, string> = {
  top_left: "left-3 top-3",
  top_right: "right-3 top-3",
  bottom_left: "bottom-3 left-3",
  bottom_right: "bottom-3 right-3",
};

const paperClassByStyle: Record<StickyNoteStyle, string> = {
  default: "memory-paper-mint",
  yellow: "memory-paper-yellow",
  pink: "memory-paper-lavender",
  blue: "memory-paper-sky",
  glass: "memory-paper-mint",
  sky: "memory-paper-sky",
  mint: "memory-paper-mint",
  lavender: "memory-paper-lavender",
};

const penClassByStyle: Record<MemoryPenStyle, string> = {
  classic_pen: "memory-pen-classic",
  marker: "memory-pen-marker",
  fountain_pen: "memory-pen-fountain",
};

type MemoryAttachmentStyle = "tape" | "pin";

function getMemoryAttachmentStyle(postId: string): MemoryAttachmentStyle {
  let seed = 0;

  for (const character of postId) {
    seed += character.charCodeAt(0);
  }

  if (seed % 3 !== 0) {
    return "tape";
  }

  return "pin";
}

export function MemoryCard({
  post,
  stickers = [],
  selected = false,
  canEditStickers = false,
  canDeletePost = false,
  canEditPost = canDeletePost,
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
  canEditPost?: boolean;
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
  const editHref = `/memories/${post.id}/edit${
    returnPath ? `?returnPath=${encodeURIComponent(returnPath)}` : ""
  }`;
  const hasPhoto = post.imageUrl.trim().length > 0;
  const hasMessage = (post.caption?.trim().length ?? 0) > 0;
  const paperClassName = paperClassByStyle[post.stickyNoteStyle] ?? "memory-paper-mint";
  const penClassName = penClassByStyle[post.memoryPenStyle] ?? "memory-pen-classic";
  const attachmentStyle = getMemoryAttachmentStyle(post.id);

  const overlayStickers = stickers.map((sticker) => (
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
  ));

  const cornerStickers = post.stickers.map((sticker) => (
    <div
      className={cn(
        "pointer-events-none absolute z-30",
        placementClass[sticker.placement],
      )}
      key={`${sticker.stickerId}-${sticker.placement}`}
    >
      <StickerVisual size={62} stickerId={sticker.stickerId} />
    </div>
  ));

  return (
    <article
      className="mx-auto w-full min-w-0 max-w-[25.5rem] break-inside-avoid pt-4"
      style={{ transform: `rotate(${post.rotation}deg)` }}
    >
      <div
        data-memory-card-id={post.id}
        id={`memory-${post.id}`}
        onClick={() => onSelect?.(post.id)}
        className={cn(
          "memory-post-card relative min-w-0 max-w-full overflow-visible rounded-[1.15rem] border-2 bg-[#fffaf0] p-3 text-black transition sm:p-4",
          !hasPhoto && "memory-post-card-note-only",
          selected ? "ring-4 ring-pink-200/85 ring-offset-2 ring-offset-[#fffaf0]" : "",
        )}
      >
        {attachmentStyle === "tape" ? (
          <span className="memory-card-tape memory-card-tape-top-center" aria-hidden="true" />
        ) : (
          <span
            className="memory-card-push-pin memory-card-push-pin-center"
            aria-hidden="true"
          />
        )}

        <header className="relative z-10 flex min-h-7 items-center justify-between gap-2 border-b-2 border-dashed border-black/15 px-1 pb-2">
          <time className="min-w-0 text-xs font-bold text-slate-500">
            {formatDate(post.createdAt)}
          </time>
          {canEditPost || canDeletePost ? (
            <div className="memory-card-action-row flex shrink-0 items-center gap-1">
              {canEditPost ? (
                <Link
                  aria-label="Edit memory"
                  className="memory-card-icon-button inline-flex size-10 shrink-0 items-center justify-center rounded-[0.85rem] p-0 transition memory-edit-icon-button"
                  href={editHref}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="memory-card-icon-image h-7 w-7 object-contain"
                    height={40}
                    src="/memory-board-actions/edit.png"
                    width={40}
                  />
                </Link>
              ) : null}
              {canDeletePost ? (
                <button
                  aria-label="Delete memory"
                  className="memory-card-icon-button inline-flex size-10 shrink-0 items-center justify-center rounded-[0.85rem] p-0 transition memory-delete-icon-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteOpen(true);
                  }}
                  type="button"
                >
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="memory-card-icon-image h-7 w-7 object-contain"
                    height={40}
                    src="/memory-board-actions/delete.png"
                    width={40}
                  />
                </button>
              ) : null}
            </div>
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

        {hasPhoto ? (
          <div className="memory-post-media relative z-10 mx-auto mt-3 overflow-hidden rounded-[0.95rem] border-2 bg-white">
            <img
              src={post.imageUrl}
              alt={post.caption ?? "Event memory"}
              className="memory-post-image"
              loading="lazy"
            />
            <div
              ref={stickerLayerRef}
              className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
              data-sticker-layer-for={post.id}
            >
              {overlayStickers}
            </div>
            {cornerStickers}
          </div>
        ) : null}

        {hasMessage ? (
          <div
            className={cn(
              "memory-post-message-note relative z-10 mt-3 overflow-hidden rounded-[0.85rem] border-2 px-4 py-4",
              !hasPhoto && "min-h-[13.5rem]",
              paperClassName,
              penClassName,
            )}
          >
            {!hasPhoto ? (
              <>
                <div
                  ref={stickerLayerRef}
                  className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
                  data-sticker-layer-for={post.id}
                >
                  {overlayStickers}
                </div>
                {cornerStickers}
              </>
            ) : null}
            <p className="relative z-10 min-w-0 whitespace-pre-wrap break-words text-base text-black [overflow-wrap:anywhere]">
              {post.caption}
            </p>
          </div>
        ) : null}

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
