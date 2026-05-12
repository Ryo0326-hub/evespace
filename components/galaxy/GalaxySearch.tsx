"use client";

import { useMemo, useState } from "react";
import { sharingScopeLabel } from "@/lib/boards/labels";
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
      return events;
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
      className={`glass-panel w-[min(92vw,42rem)] rounded-[1.5rem] p-2 transition sm:rounded-[2rem] sm:p-3 ${
        disabled ? "scale-95 opacity-0" : "opacity-100"
      }`}
    >
      <label className="sr-only" htmlFor="event-search">
        Search the galaxy
      </label>
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-3 sm:px-5 sm:py-4">
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

      <div className="mt-2 max-h-[10.75rem] overflow-y-auto rounded-[1.25rem] border border-white/10 bg-slate-950/70 sm:mt-3 sm:max-h-[12rem] sm:rounded-3xl">
        {suggestions.length > 0 ? (
          suggestions.map((event, index) => {
            const ownerName = event.ownerDisplayName || "Evespace organizer";

            return (
              <button
                key={event.id}
                type="button"
                disabled={disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onSelect(event)}
                className={`grid min-h-[5.375rem] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-left transition sm:min-h-24 sm:gap-4 sm:px-5 sm:py-4 ${
                  index === activeIndex
                    ? "bg-cyan-200/15 text-white"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <span className="grid min-w-0 gap-0.5 sm:gap-1">
                  <span className="truncate font-semibold">{event.title}</span>
                  <span className="truncate text-sm text-slate-400">
                    {compactDateLocation(event.startTime, event.locationName)}
                  </span>
                  {event.boardType === "official_event" ? (
                    <span className="flex flex-wrap gap-1.5">
                      <span className="w-fit rounded-full border border-cyan-200/25 bg-cyan-200/10 px-2.5 py-1 text-xs text-cyan-100">
                        Official Event
                      </span>
                      {event.isVerified ? (
                        <span className="w-fit rounded-full border border-emerald-200/30 bg-emerald-300/15 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                          Verified
                        </span>
                      ) : null}
                    </span>
                  ) : event.category ? (
                    <span className="w-fit rounded-full border border-purple-200/20 bg-purple-200/10 px-2.5 py-1 text-xs text-purple-100">
                      {event.category}
                    </span>
                  ) : event.boardType === "private_memory" ? (
                    <span className="w-fit rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-xs text-cyan-100">
                      {sharingScopeLabel(event.sharingScope)}
                    </span>
                  ) : null}
                </span>

                <span className="flex max-w-[9rem] items-center justify-end gap-2 text-right">
                  <span className="hidden min-w-0 sm:block">
                    <span className="block truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Owner
                    </span>
                    <span className="block truncate text-xs font-semibold text-slate-200">
                      {ownerName}
                    </span>
                  </span>
                  <span
                    aria-label={`Event owner ${ownerName}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-100/15 text-xs font-bold text-cyan-50 sm:size-10"
                    title={`Owner: ${ownerName}`}
                  >
                    {getInitials(ownerName)}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <p className="px-5 py-5 text-sm text-slate-300">
            No board found in this galaxy yet.
          </p>
        )}
      </div>
    </div>
  );
}

function getInitials(value: string) {
  return (
    value
      .split(/[ @._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "EV"
  );
}
