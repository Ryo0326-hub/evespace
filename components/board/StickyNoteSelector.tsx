"use client";

import { stickyNoteStyles } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { StickyNoteStyle } from "@/types/evespace";

export function StickyNoteSelector({
  value,
  onChange,
}: {
  value: StickyNoteStyle;
  onChange: (value: StickyNoteStyle) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {stickyNoteStyles.map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => onChange(style)}
          className={cn(
            "rounded-2xl border px-3 py-3 text-sm capitalize transition",
            value === style
              ? "border-purple-200 bg-purple-200/15 text-purple-50"
              : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10",
          )}
        >
          {style}
        </button>
      ))}
    </div>
  );
}
