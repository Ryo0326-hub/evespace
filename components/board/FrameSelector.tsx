"use client";

import { frameStyles } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FrameStyle } from "@/types/evespace";

export function FrameSelector({
  value,
  onChange,
}: {
  value: FrameStyle;
  onChange: (value: FrameStyle) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {frameStyles.map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => onChange(style)}
          className={cn(
            "rounded-2xl border px-3 py-3 text-sm capitalize transition",
            value === style
              ? "border-cyan-200 bg-cyan-200/15 text-cyan-50"
              : "border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10",
          )}
        >
          {style.replace("_", " ")}
        </button>
      ))}
    </div>
  );
}
