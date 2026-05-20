"use client";

import { Button } from "@/components/ui/Button";

export function StickerStoreButton() {
  return (
    <Button
      className="memory-board-cute-button min-h-11 w-full rounded-full px-4 py-2 text-xs font-black sm:w-auto"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("evespace:toggle-sticker-store"));
      }}
      type="button"
      variant="secondary"
    >
      Sticker Store
    </Button>
  );
}
