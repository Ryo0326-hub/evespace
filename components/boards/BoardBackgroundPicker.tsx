import { boardBackgrounds, boardThemes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BoardBackgroundTheme } from "@/types/evespace";

export function BoardBackgroundPicker({
  defaultValue = "soft_cream",
}: {
  defaultValue?: BoardBackgroundTheme;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-slate-200">Board background</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {boardThemes.slice(0, 3).map((theme) => {
          const background = boardBackgrounds[theme];

          return (
            <label
              className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm text-slate-200 transition hover:bg-white/10 has-[:checked]:border-cyan-400 has-[:checked]:bg-cyan-400/10 has-[:checked]:ring-1 has-[:checked]:ring-cyan-400"
              key={theme}
            >
              <input
                className="sr-only peer"
                defaultChecked={theme === defaultValue}
                name="boardBackgroundTheme"
                type="radio"
                value={theme}
              />
              <span
                className={cn(
                  "block h-16 rounded-xl border border-black/20",
                  background.swatchClassName,
                )}
              />
              <span className="mt-2 block text-xs font-semibold peer-checked:text-cyan-100">
                {background.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
