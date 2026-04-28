"use client";

import { useMemo, useState } from "react";
import { compactDateLocation } from "@/lib/utils";
import type { Event } from "@/types/evespace";

export function GalaxySearch({
  events,
  disabled,
  personalized = false,
  onSelect,
}: {
  events: Event[];
  disabled?: boolean;
  personalized?: boolean;
  onSelect: (event: Event) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return events.slice(0, 4);
    }

    return events
      .filter((event) => {
        const searchable = [
          event.title,
          event.category,
          event.locationName,
          event.address,
          event.startTime,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalized);
      })
      .slice(0, 5);
  }, [events, query]);

  return (
    <div
      className={`glass-panel w-[min(92vw,42rem)] rounded-[2rem] p-3 transition ${
        disabled ? "scale-95 opacity-0" : "opacity-100"
      }`}
    >
      <label className="sr-only" htmlFor="event-search">
        Search the galaxy
      </label>
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-4">
        <span className="text-cyan-100" aria-hidden="true">
          *
        </span>
        <input
          id="event-search"
          value={query}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.min(index + 1, Math.max(suggestions.length - 1, 0)),
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }

            if (event.key === "Enter" && suggestions[activeIndex]) {
              event.preventDefault();
              onSelect(suggestions[activeIndex]);
            }
          }}
          className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-400"
          placeholder={
            personalized
              ? "Search official, personal, and friends' boards..."
              : "Search official events in the galaxy..."
          }
          autoComplete="off"
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
        {suggestions.length > 0 ? (
          suggestions.map((event, index) => (
            <button
              key={event.id}
              type="button"
              disabled={disabled}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect(event)}
              className={`grid w-full gap-1 px-5 py-4 text-left transition ${
                index === activeIndex
                  ? "bg-cyan-200/15 text-white"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <span className="font-semibold">{event.title}</span>
              <span className="text-sm text-slate-400">
                {compactDateLocation(event.startTime, event.locationName)}
              </span>
              {event.category ? (
                <span className="w-fit rounded-full border border-purple-200/20 bg-purple-200/10 px-2.5 py-1 text-xs text-purple-100">
                  {event.category}
                </span>
              ) : event.boardType === "private_memory" ? (
                <span className="w-fit rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-xs text-cyan-100">
                  Private memory board
                </span>
              ) : null}
            </button>
          ))
        ) : (
          <p className="px-5 py-5 text-sm text-slate-300">
            No board found in this galaxy yet.
          </p>
        )}
      </div>
    </div>
  );
}
