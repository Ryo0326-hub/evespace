import { stickerOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StickerId } from "@/types/evespace";

export function getStickerOption(stickerId: StickerId) {
  return stickerOptions.find((sticker) => sticker.id === stickerId) ?? stickerOptions[0];
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
    <div
      aria-label={`${sticker.name} sticker`}
      className={cn(
        "flex select-none items-center justify-center rounded-[1.4rem] border border-white/80 bg-gradient-to-br text-center text-[0.62rem] font-black tracking-[0.12em] shadow-[0_16px_30px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-black/5",
        sticker.accentClassName,
        className,
      )}
      role="img"
      style={{
        height: size,
        width: size,
      }}
    >
      <span className="drop-shadow-sm">{sticker.label}</span>
    </div>
  );
}
