"use client";

import { useMemo, useState } from "react";
import { MemoryCard } from "@/components/board/MemoryCard";
import { StickerStorePanel } from "@/components/board/StickerStorePanel";
import { StickerVisual } from "@/components/board/StickerVisual";
import { Button } from "@/components/ui/Button";
import type { MemoryPost, PlacedSticker, StickerId } from "@/types/evespace";

type DragGhost = {
  stickerId: StickerId;
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createStickerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sticker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSeedStickers(posts: MemoryPost[]): PlacedSticker[] {
  return posts.slice(0, 3).map((post, index) => ({
    id: `demo-sticker-${post.id}`,
    postId: post.id,
    stickerId: (["starburst", "camera", "heart"] as StickerId[])[index] ?? "starburst",
    x: 24 + index * 10,
    y: 76 + index * 14,
    rotation: [-8, 7, -4][index] ?? 0,
    size: 66,
  }));
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

export function InteractiveMemoryBoard({ posts }: { posts: MemoryPost[] }) {
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id ?? "");
  const [stickers, setStickers] = useState<PlacedSticker[]>(() =>
    createSeedStickers(posts),
  );
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null);

  const stickersByPost = useMemo(() => {
    return stickers.reduce<Record<string, PlacedSticker[]>>((groups, sticker) => {
      groups[sticker.postId] = [...(groups[sticker.postId] ?? []), sticker];
      return groups;
    }, {});
  }, [stickers]);

  function addSticker(
    stickerId: StickerId,
    options: {
      postId?: string;
      clientX?: number;
      clientY?: number;
    } = {},
  ) {
    const dropCard =
      typeof options.clientX === "number" && typeof options.clientY === "number"
        ? getDropCard(options.clientX, options.clientY)
        : null;
    const targetPostId =
      dropCard?.dataset.memoryCardId ||
      options.postId ||
      selectedPostId ||
      posts[0]?.id;

    if (!targetPostId) {
      return;
    }

    const stickerSize = 68;
    const layer = dropCard?.querySelector<HTMLElement>(
      `[data-sticker-layer-for="${targetPostId}"]`,
    );
    const rect = layer?.getBoundingClientRect();
    const x =
      rect && typeof options.clientX === "number"
        ? clamp(
            options.clientX - rect.left - stickerSize / 2,
            10,
            Math.max(10, rect.width - stickerSize - 10),
          )
        : 24 + (stickers.length % 4) * 28;
    const y =
      rect && typeof options.clientY === "number"
        ? clamp(
            options.clientY - rect.top - stickerSize / 2,
            10,
            Math.max(10, rect.height - stickerSize - 10),
          )
        : 82 + (stickers.length % 3) * 26;

    setSelectedPostId(targetPostId);
    setStickers((current) => [
      ...current,
      {
        id: createStickerId(),
        postId: targetPostId,
        stickerId,
        x: Math.round(x),
        y: Math.round(y),
        rotation: Math.round((Math.random() * 16 - 8) * 10) / 10,
        size: stickerSize,
      },
    ]);
  }

  function moveSticker(stickerId: string, x: number, y: number) {
    setStickers((current) =>
      current.map((sticker) =>
        sticker.id === stickerId ? { ...sticker, x, y } : sticker,
      ),
    );
  }

  function startStickerDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    stickerId: StickerId,
  ) {
    event.preventDefault();

    const origin = {
      x: event.clientX,
      y: event.clientY,
    };
    let didMove = false;

    setDragGhost({ stickerId, x: event.clientX, y: event.clientY });

    function handlePointerMove(moveEvent: PointerEvent) {
      const delta =
        Math.abs(moveEvent.clientX - origin.x) + Math.abs(moveEvent.clientY - origin.y);
      if (delta > 6) {
        didMove = true;
      }

      setDragGhost({
        stickerId,
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      });
    }

    function finishDrag(upEvent: PointerEvent) {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      setDragGhost(null);

      addSticker(stickerId, {
        clientX: didMove ? upEvent.clientX : undefined,
        clientY: didMove ? upEvent.clientY : undefined,
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  }

  return (
    <section className="relative">
      <div className="sticky top-3 z-30 mb-4 flex justify-end">
        <Button
          className="min-h-10 px-4 py-2 text-xs shadow-lg shadow-black/20"
          onClick={() => setStoreOpen((open) => !open)}
          type="button"
          variant="secondary"
        >
          {storeOpen ? "Hide Stickers" : "Stickers"}
        </Button>
      </div>

      <div className="memory-grid">
        {posts.map((post) => (
          <MemoryCard
            key={post.id}
            onSelect={setSelectedPostId}
            onStickerMove={moveSticker}
            post={post}
            selected={selectedPostId === post.id}
            stickers={stickersByPost[post.id] ?? []}
          />
        ))}
      </div>

      <StickerStorePanel
        onAddSticker={(stickerId) => addSticker(stickerId)}
        onClose={() => setStoreOpen(false)}
        onStartStickerDrag={startStickerDrag}
        open={storeOpen}
      />

      {dragGhost ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: dragGhost.x,
            top: dragGhost.y,
          }}
        >
          <StickerVisual
            className="scale-110 shadow-[0_28px_58px_rgba(15,23,42,0.38)]"
            size={76}
            stickerId={dragGhost.stickerId}
          />
        </div>
      ) : null}
    </section>
  );
}
