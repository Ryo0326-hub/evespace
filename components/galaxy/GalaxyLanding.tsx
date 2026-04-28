"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { GalaxyCanvas } from "@/components/galaxy/GalaxyCanvas";
import { GalaxySearch } from "@/components/galaxy/GalaxySearch";
import type { Event } from "@/types/evespace";

export function GalaxyLanding({ events }: { events: Event[] }) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleZoomComplete = useCallback(
    (event: Event) => {
      router.push(`/events/${event.slug}`);
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
            onSelect={setSelectedEvent}
          />
        </div>
      </section>
    </main>
  );
}
