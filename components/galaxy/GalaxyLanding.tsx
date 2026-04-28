"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { GalaxyCanvas } from "@/components/galaxy/GalaxyCanvas";
import { GalaxySearch } from "@/components/galaxy/GalaxySearch";
import { LinkButton } from "@/components/ui/Button";
import type { Event } from "@/types/evespace";

export function GalaxyLanding({
  events,
  personalized = false,
}: {
  events: Event[];
  personalized?: boolean;
}) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleZoomComplete = useCallback(
    (event: Event) => {
      router.push(
        event.boardType === "private_memory"
          ? `/boards/${event.id}`
          : `/events/${event.slug}`,
      );
    },
    [router],
  );

  return (
    <main className="cosmic-bg relative min-h-screen overflow-hidden">
      <GalaxyCanvas
        events={events}
        selectedEvent={selectedEvent}
        onZoomComplete={handleZoomComplete}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,7,18,0.16)_46%,rgba(3,7,18,0.72)_100%)]" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-3 py-24 sm:px-4">
        <div className="grid w-full justify-items-center gap-7 text-center sm:gap-8">
          <div
            className={`max-w-2xl transition duration-700 ${
              selectedEvent ? "translate-y-3 opacity-0" : "opacity-100"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-100/80 sm:text-sm sm:tracking-[0.45em]">
              Leave a memory
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-6xl">
              Find your event.
            </h1>
          </div>

          <GalaxySearch
            events={events}
            disabled={Boolean(selectedEvent)}
            personalized={personalized}
            onSelect={setSelectedEvent}
          />

          {events.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 text-center shadow-2xl shadow-black/30 backdrop-blur">
              <p className="text-lg font-semibold text-white">
                The public galaxy is waiting for its first official stars.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {personalized
                  ? "Create a private board or follow friends to fill your galaxy."
                  : "Verified organization-hosted events will appear here soon."}
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <LinkButton className="text-black" href="/boards/new">
                  Create a private memory board
                </LinkButton>
                <LinkButton href="/dashboard" variant="secondary">
                  Organizer dashboard
                </LinkButton>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
