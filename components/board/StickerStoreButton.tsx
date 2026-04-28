"use client";

import { Button } from "@/components/ui/Button";

export function StickerStoreButton() {
  return (
    <Button
      className="min-h-11 w-full rounded-2xl border border-black/20 bg-white px-4 py-2 text-xs font-black text-black shadow-xl shadow-black/10 sm:w-auto"
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
