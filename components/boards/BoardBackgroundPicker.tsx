"use client";

import { useEffect, useState } from "react";
import {
  BOARD_THEME_OPTIONS,
  getBoardTheme,
  toBoardThemeId,
} from "@/lib/board-themes";
import { cn } from "@/lib/utils";
import type { BoardBackgroundTheme } from "@/types/evespace";

const pageThemeClasses = BOARD_THEME_OPTIONS.map(
  (theme) => getBoardTheme(theme).pageClassName,
);

export function BoardBackgroundPicker({
  defaultValue,
}: {
  defaultValue?: BoardBackgroundTheme | string | null;
}) {
  const [selectedTheme, setSelectedTheme] = useState<BoardBackgroundTheme>(
    toBoardThemeId(defaultValue),
  );

  useEffect(() => {
    const page = document.querySelector<HTMLElement>("[data-board-theme-page]");

    if (!page) {
      return;
    }

    page.classList.remove(...pageThemeClasses);
    page.classList.add(getBoardTheme(selectedTheme).pageClassName);
  }, [selectedTheme]);

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <p className="text-sm font-black text-slate-800">Board background</p>
        <p className="text-xs font-bold leading-5 text-slate-600">
          Choose the visual world this memory board will use everywhere.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BOARD_THEME_OPTIONS.map((theme) => {
          const background = getBoardTheme(theme);
          const isSelected = selectedTheme === theme;

          return (
            <label
              className={cn(
                "group cursor-pointer rounded-[1.25rem] border-2 border-black/15 bg-white/60 p-3 text-sm text-slate-800 transition hover:-translate-y-0.5 hover:bg-white/85",
                isSelected &&
                  "border-black bg-white/85 shadow-[4px_4px_0_rgba(17,24,39,0.2)]",
              )}
              key={theme}
            >
              <input
                checked={isSelected}
                className="sr-only"
                name="boardBackgroundTheme"
                onChange={() => setSelectedTheme(theme)}
                type="radio"
                value={theme}
              />
              <span
                className={cn(
                  "block h-20 rounded-[1rem] border border-black/25 shadow-[3px_3px_0_rgba(0,0,0,0.18)]",
                  background.previewClassName,
                )}
              />
              <span className="mt-3 block text-xs font-black text-black">
                {background.label}
              </span>
              <span className="mt-1 block text-[0.7rem] font-bold leading-4 text-slate-600">
                {background.description}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
