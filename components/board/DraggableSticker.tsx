"use client";

import { useRef, useState } from "react";
import { StickerVisual } from "@/components/board/StickerVisual";
import type { PlacedSticker } from "@/types/evespace";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function DraggableSticker({
  sticker,
  containerRef,
  onMove,
}: {
  sticker: PlacedSticker;
  containerRef: React.RefObject<HTMLElement | null>;
  onMove?: (stickerId: string, x: number, y: number) => void;
}) {
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const position = dragPosition ?? { x: sticker.x, y: sticker.y };

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    const moveSticker = onMove;

    if (!moveSticker) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }
    const containerElement = container;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);

    const start = {
      x: event.clientX,
      y: event.clientY,
    };
    const origin = {
      x: sticker.x,
      y: sticker.y,
    };
    const padding = 8;

    function handlePointerMove(moveEvent: PointerEvent) {
      const maxX = Math.max(padding, containerElement.clientWidth - sticker.size - padding);
      const maxY = Math.max(padding, containerElement.clientHeight - sticker.size - padding);
      const nextPosition = {
        x: clamp(origin.x + moveEvent.clientX - start.x, padding, maxX),
        y: clamp(origin.y + moveEvent.clientY - start.y, padding, maxY),
      };

      pendingRef.current = nextPosition;

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (pendingRef.current) {
          setDragPosition(pendingRef.current);
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
      setDragPosition(null);
      moveSticker?.(sticker.id, Math.round(latest.x), Math.round(latest.y));
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  }

  return (
    <button
      aria-label="Move sticker"
      className={`absolute touch-none transition-transform ${
        onMove ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      } ${isDragging ? "z-30 scale-110" : "z-10 hover:scale-105"}`}
      onPointerDown={handlePointerDown}
      style={{
        left: position.x,
        top: position.y,
        transform: `rotate(${sticker.rotation}deg)`,
      }}
      type="button"
    >
      <StickerVisual
        className={
          isDragging
            ? "shadow-[0_26px_52px_rgba(15,23,42,0.34)]"
            : "shadow-[0_14px_28px_rgba(15,23,42,0.24)]"
        }
        size={sticker.size}
        stickerId={sticker.stickerId}
      />
    </button>
  );
}
