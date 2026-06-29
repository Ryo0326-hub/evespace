/* eslint-disable @next/next/no-img-element */
import { getSticker, STICKERS } from "@/lib/stickers/sticker-registry";
import { cn } from "@/lib/utils";
import type { StickerId } from "@/types/evespace";

export function getStickerOption(stickerId: StickerId) {
  return getSticker(stickerId) ?? STICKERS[0];
}

export function StickerVisual({
  stickerId,
  className,
  size = 72,
}: {
  stickerId: StickerId;
  className?: string;
  size?: number;
}) {
  const sticker = getStickerOption(stickerId);

  return (
    <img
      alt={`${sticker.name} sticker`}
      className={cn(
        "pointer-events-none select-none object-contain [-webkit-touch-callout:none] [-webkit-user-drag:none]",
        className,
      )}
      draggable={false}
      height={size}
      onContextMenu={(event) => event.preventDefault()}
      src={sticker.src}
      style={{ height: size, width: size }}
      width={size}
    />
  );
}
