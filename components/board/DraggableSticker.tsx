"use client";

import { useRef, useState } from "react";
import { StickerVisual } from "@/components/board/StickerVisual";
import type { PlacedSticker } from "@/types/evespace";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRelativePosition(position: number, availableSpace: number) {
  if (availableSpace <= 0) {
    return 0;
  }

  return clamp(position / availableSpace, 0, 1);
}

export function DraggableSticker({
  sticker,
  containerRef,
  onMove,
  onDelete,
}: {
  sticker: PlacedSticker;
  containerRef: React.RefObject<HTMLElement | null>;
  onMove?: (stickerId: string, x: number, y: number) => void;
  onDelete?: (stickerId: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const stickerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const padding = 8;

  function getBoundedPosition(value: number) {
    const percent = value * 100;
    const reservedSpace = value * (sticker.size + padding * 2);

    return `calc(${padding}px + ${percent}% - ${reservedSpace}px)`;
  }

  function getTransform() {
    const lift = isDragging ? " scale(1.08)" : "";

    return `rotate(${sticker.rotation}deg)${lift}`;
  }

  function applyPosition(x: number, y: number) {
    if (!stickerRef.current) {
      return;
    }

    stickerRef.current.style.left = `${x}px`;
    stickerRef.current.style.top = `${y}px`;
    stickerRef.current.style.transform = `rotate(${sticker.rotation}deg) scale(1.08)`;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const moveSticker = onMove;

    if (!moveSticker) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }
    const containerElement = container;
    const stickerElement = stickerRef.current;

    if (!stickerElement) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);

    const containerRect = containerElement.getBoundingClientRect();
    const stickerRect = stickerElement.getBoundingClientRect();
    const availableX = Math.max(1, containerRect.width - sticker.size - padding * 2);
    const availableY = Math.max(1, containerRect.height - sticker.size - padding * 2);
    const origin = {
      x: padding + sticker.x * availableX,
      y: padding + sticker.y * availableY,
    };
    const originPointer = {
      x: event.clientX,
      y: event.clientY,
    };
    const grabOffset = {
      x: event.clientX - stickerRect.left,
      y: event.clientY - stickerRect.top,
    };
    let didMove = false;

    function handlePointerMove(moveEvent: PointerEvent) {
      moveEvent.preventDefault();

      if (
        Math.abs(moveEvent.clientX - originPointer.x) +
          Math.abs(moveEvent.clientY - originPointer.y) >
        4
      ) {
        didMove = true;
      }

      const nextPosition = {
        x: clamp(
          moveEvent.clientX - containerRect.left - grabOffset.x,
          padding,
          padding + availableX,
        ),
        y: clamp(
          moveEvent.clientY - containerRect.top - grabOffset.y,
          padding,
          padding + availableY,
        ),
      };

      pendingRef.current = nextPosition;

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (pendingRef.current) {
          applyPosition(pendingRef.current.x, pendingRef.current.y);
        }
      });
    }

    function finishDrag() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      const latest = pendingRef.current ?? origin;
      pendingRef.current = null;
      setIsDragging(false);

      if (!didMove) {
        setShowDelete((visible) => !visible);
        return;
      }

      setShowDelete(false);
      moveSticker?.(
        sticker.id,
        getRelativePosition(latest.x - padding, availableX),
        getRelativePosition(latest.y - padding, availableY),
      );
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  }

  return (
    <div
      aria-label="Move sticker"
      className={`group absolute touch-none ${
        onMove ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      } ${isDragging ? "z-30" : "z-10"}`}
      onPointerDown={handlePointerDown}
      ref={stickerRef}
      role="button"
      style={{
        left: getBoundedPosition(sticker.x),
        top: getBoundedPosition(sticker.y),
        transform: getTransform(),
        width: sticker.size,
      }}
      tabIndex={0}
    >
      <StickerVisual size={sticker.size} stickerId={sticker.stickerId} />
      {onDelete ? (
        <button
          aria-label="Delete sticker"
          className={`absolute -right-2 -top-2 grid size-7 place-items-center rounded-full border border-black bg-white text-sm font-black leading-none text-black shadow-lg transition ${
            showDelete ? "opacity-100 sm:opacity-0" : "opacity-0"
          } sm:group-hover:opacity-100`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(sticker.id);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          type="button"
        >
          x
        </button>
      ) : null}
    </div>
  );
}
