"use client";

import { syncOverlayStickersAction } from "@/app/actions/memories";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemoryCard } from "@/components/board/MemoryCard";
import { StickerStorePanel } from "@/components/board/StickerStorePanel";
import { getStickerOption } from "@/components/board/StickerVisual";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MemoryPost, PlacedSticker, StickerId } from "@/types/evespace";

const maxStickersPerPost = 3;
const placedStickerSize = 68;
const dragGhostSize = 50;
const stickerPadding = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toRelativePosition(position: number, availableSpace: number) {
  if (availableSpace <= 0) {
    return 0;
  }

  return clamp(position / availableSpace, 0, 1);
}

function createStickerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sticker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDropCard(clientX: number, clientY: number) {
  const elements = document.elementsFromPoint(clientX, clientY);

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const card = element.closest<HTMLElement>("[data-memory-card-id]");
    if (card) {
      return card;
    }
  }

  return null;
}

export function InteractiveMemoryBoard({
  boardId,
  posts,
  returnPath,
  viewerProfileId,
}: {
  boardId: string;
  posts: MemoryPost[];
  returnPath: string;
  viewerProfileId: string | null;
}) {
  const firstOwnedPostId = useMemo(() => {
    if (!viewerProfileId) {
      return "";
    }

    const owned = posts.find((post) => post.profileId === viewerProfileId);
    return owned?.id ?? "";
  }, [posts, viewerProfileId]);

  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(firstOwnedPostId);
  const [stickers, setStickers] = useState<PlacedSticker[]>(() =>
    posts.flatMap((post) => post.overlayStickers),
  );
  const [limitWarning, setLimitWarning] = useState("");
  const warningTimeoutRef = useRef<number | null>(null);
  const skipInitialSave = useRef(true);

  const ownsPost = useCallback(
    (postId: string | undefined | null) => {
      if (!viewerProfileId || !postId) {
        return false;
      }

      const post = posts.find((item) => item.id === postId);
      return Boolean(post?.profileId && post.profileId === viewerProfileId);
    },
    [posts, viewerProfileId],
  );

  function handleSelectPost(postId: string) {
    if (ownsPost(postId)) {
      setSelectedPostId(postId);
    }
  }

  const stickersByPost = useMemo(() => {
    return stickers.reduce<Record<string, PlacedSticker[]>>((groups, sticker) => {
      groups[sticker.postId] = [...(groups[sticker.postId] ?? []), sticker];
      return groups;
    }, {});
  }, [stickers]);

  const stickerStoreHint = useMemo(() => {
    if (!viewerProfileId) {
      return "Sign in to add stickers on your memories.";
    }

    if (!firstOwnedPostId) {
      return "Stickers only go on memories you posted. Post one first.";
    }

    return undefined;
  }, [viewerProfileId, firstOwnedPostId]);

  useEffect(() => {
    function toggleStore() {
      setStoreOpen((open) => !open);
    }

    window.addEventListener("evespace:toggle-sticker-store", toggleStore);

    return () => {
      window.removeEventListener("evespace:toggle-sticker-store", toggleStore);
    };
  }, []);

  useEffect(() => {
    if (!viewerProfileId || !boardId) {
      return;
    }

    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }

    const ownedOnly = stickers.filter((sticker) => ownsPost(sticker.postId));

    const timeoutId = window.setTimeout(() => {
      syncOverlayStickersAction({ boardId, stickers: ownedOnly }).catch((error) => {
        console.error("Failed to save stickers", error);
      });
    }, 750);

    return () => window.clearTimeout(timeoutId);
  }, [stickers, boardId, viewerProfileId, ownsPost]);

  function addSticker(
    stickerId: StickerId,
    options: {
      postId?: string;
      clientX?: number;
      clientY?: number;
      dropOffsetX?: number;
      dropOffsetY?: number;
      requireDropTarget?: boolean;
    } = {},
  ) {
    if (!viewerProfileId) {
      return;
    }

    const dropCard =
      typeof options.clientX === "number" && typeof options.clientY === "number"
        ? getDropCard(options.clientX, options.clientY)
        : null;
    const rawTarget =
      dropCard?.dataset.memoryCardId ||
      options.postId ||
      selectedPostId ||
      firstOwnedPostId ||
      "";

    if (options.requireDropTarget && !dropCard) {
      return;
    }

    if (!rawTarget) {
      return;
    }

    if (!ownsPost(rawTarget)) {
      return;
    }

    const targetPostId = rawTarget;

    const layer = dropCard?.querySelector<HTMLElement>(
      `[data-sticker-layer-for="${targetPostId}"]`,
    );
    const rect = layer?.getBoundingClientRect();
    const dropOffsetX = options.dropOffsetX ?? placedStickerSize / 2;
    const dropOffsetY = options.dropOffsetY ?? placedStickerSize / 2;
    const availableX = rect
      ? Math.max(1, rect.width - placedStickerSize - stickerPadding * 2)
      : 1;
    const availableY = rect
      ? Math.max(1, rect.height - placedStickerSize - stickerPadding * 2)
      : 1;

    setSelectedPostId(targetPostId);

    setStickers((current) => {
      const countForPost = current.filter((item) => item.postId === targetPostId).length;

      if (countForPost >= maxStickersPerPost) {
        showLimitWarning();
        return current;
      }

      const pixelX =
        rect && typeof options.clientX === "number"
          ? clamp(
              options.clientX - rect.left - dropOffsetX,
              stickerPadding,
              stickerPadding + availableX,
            )
          : stickerPadding + ((current.length % 4) / 4) * availableX;
      const pixelY =
        rect && typeof options.clientY === "number"
          ? clamp(
              options.clientY - rect.top - dropOffsetY,
              stickerPadding,
              stickerPadding + availableY,
            )
          : stickerPadding + 0.35 * availableY + ((current.length % 3) / 8) * availableY;
      const x = toRelativePosition(pixelX - stickerPadding, availableX);
      const y = toRelativePosition(pixelY - stickerPadding, availableY);

      return [
        ...current,
        {
          id: createStickerId(),
          postId: targetPostId,
          stickerId,
          x,
          y,
          rotation: Math.round((Math.random() * 16 - 8) * 10) / 10,
          size: placedStickerSize,
        },
      ];
    });
  }

  function showLimitWarning() {
    setLimitWarning("This post already has 3 stickers. Delete one to add another.");

    if (warningTimeoutRef.current !== null) {
      window.clearTimeout(warningTimeoutRef.current);
    }

    warningTimeoutRef.current = window.setTimeout(() => {
      setLimitWarning("");
      warningTimeoutRef.current = null;
    }, 3200);
  }

  function moveSticker(stickerId: string, x: number, y: number) {
    setStickers((current) => {
      const sticker = current.find((item) => item.id === stickerId);
      if (!sticker || !ownsPost(sticker.postId)) {
        return current;
      }

      return current.map((item) =>
        item.id === stickerId ? { ...item, x, y } : item,
      );
    });
  }

  function deleteSticker(stickerId: string) {
    setStickers((current) => {
      const sticker = current.find((item) => item.id === stickerId);
      if (!sticker || !ownsPost(sticker.postId)) {
        return current;
      }

      return current.filter((item) => item.id !== stickerId);
    });
  }

  function startStickerDrag(
    event: React.PointerEvent<HTMLDivElement>,
    stickerId: StickerId,
  ) {
    if (!viewerProfileId) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const visual = event.currentTarget.querySelector<HTMLElement>("[data-sticker-preview]");
    const visualRect =
      visual?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
    const grabOffset = {
      x: event.clientX - visualRect.left,
      y: event.clientY - visualRect.top,
    };
    const dropScale = placedStickerSize / Math.max(1, visualRect.width);
    const dropOffset = {
      x: grabOffset.x * dropScale,
      y: grabOffset.y * dropScale,
    };
    const ghost = document.createElement("img");
    const sticker = getStickerOption(stickerId);

    const origin = {
      x: event.clientX,
      y: event.clientY,
    };
    let didMove = false;
    let latestPointer = origin;

    ghost.alt = `${sticker.name} sticker`;
    ghost.draggable = false;
    ghost.src = sticker.src;
    ghost.style.height = `${dragGhostSize}px`;
    ghost.style.left = "0";
    ghost.style.objectFit = "contain";
    ghost.style.opacity = "0.96";
    ghost.style.pointerEvents = "none";
    ghost.style.position = "fixed";
    ghost.style.top = "0";
    ghost.style.transform = `translate3d(${visualRect.left}px, ${visualRect.top}px, 0)`;
    ghost.style.width = `${dragGhostSize}px`;
    ghost.style.zIndex = "125";
    document.body.appendChild(ghost);

    function handlePointerMove(moveEvent: PointerEvent) {
      moveEvent.preventDefault();
      latestPointer = {
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      };

      const delta =
        Math.abs(moveEvent.clientX - origin.x) +
        Math.abs(moveEvent.clientY - origin.y);
      if (delta > 6) {
        didMove = true;
      }

      ghost.style.transform = `translate3d(${moveEvent.clientX - grabOffset.x}px, ${
        moveEvent.clientY - grabOffset.y
      }px, 0)`;
    }

    function finishDrag() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      ghost.remove();

      addSticker(stickerId, {
        clientX: didMove ? latestPointer.x : undefined,
        clientY: didMove ? latestPointer.y : undefined,
        dropOffsetX: didMove ? dropOffset.x : undefined,
        dropOffsetY: didMove ? dropOffset.y : undefined,
        requireDropTarget: didMove,
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  }

  const selectedCountForStore = ownsPost(selectedPostId)
    ? (stickersByPost[selectedPostId] ?? []).length
    : 0;

  return (
    <section className="relative isolate z-0 touch-pan-y overflow-visible">
      {limitWarning ? (
        <div className="fixed right-3 top-32 z-[115] max-w-[18rem] rounded-2xl border border-amber-200 bg-amber-100 px-4 py-3 text-xs font-bold text-slate-950 shadow-2xl shadow-black/25 sm:right-6 sm:top-36">
          {limitWarning}
        </div>
      ) : null}

      <div className="memory-grid touch-pan-y pt-4 sm:pt-6">
        {posts.length === 0 ? (
          <EmptyState
            description="Be the first to leave a star in this event's sky."
            title="No memories have been posted yet."
          />
        ) : (
          posts.map((post) => (
            <MemoryCard
              key={post.id}
              canEditStickers={Boolean(
                viewerProfileId && post.profileId === viewerProfileId,
              )}
              onSelect={handleSelectPost}
              onStickerDelete={deleteSticker}
              onStickerMove={moveSticker}
              post={post}
              returnPath={returnPath}
              selected={selectedPostId === post.id && ownsPost(post.id)}
              stickers={stickersByPost[post.id] ?? []}
              viewerSignedIn={Boolean(viewerProfileId)}
            />
          ))
        )}
      </div>

      <StickerStorePanel
        hint={stickerStoreHint}
        maxStickersPerPost={maxStickersPerPost}
        onAddSticker={(stickerId) => addSticker(stickerId)}
        onClose={() => setStoreOpen(false)}
        onStartStickerDrag={startStickerDrag}
        open={storeOpen}
        selectedStickerCount={selectedCountForStore}
      />
    </section>
  );
}
