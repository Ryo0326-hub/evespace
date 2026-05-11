import Image from "next/image";
import type { ReactNode } from "react";
import {
  HolographicPlanetGlobe,
  type PlanetGlobeSignal,
} from "@/components/profile/HolographicPlanetGlobe";
import { LinkButton } from "@/components/ui/Button";
import { compactDateLocation } from "@/lib/utils";
import type { Event, Profile } from "@/types/evespace";

type PlanetLevel = {
  level: 1 | 2 | 3;
  name: string;
};

const PLANET_LEVELS: PlanetLevel[] = [
  {
    level: 1,
    name: "Seed Planet",
  },
  {
    level: 2,
    name: "Living Planet",
  },
  {
    level: 3,
    name: "Constellation Planet",
  },
];

export function UserPlanet({
  actionSlot,
  events,
  meta,
  mode = "self",
  profile,
}: {
  actionSlot?: ReactNode;
  events: Event[];
  meta?: string | null;
  mode?: "self" | "public";
  profile: Profile;
}) {
  const planetLevel = getPlanetLevel(events.length);
  const nextLevel = getNextLevel(events.length);
  const progress = nextLevel
    ? Math.min(100, Math.round((events.length / nextLevel.target) * 100))
    : 100;
  const globeSignals = events.map(toGlobeSignal);
  const displayName = profile.displayName ?? "Evespace Explorer";
  const isSelf = mode === "self";
  const emptySignalText = isSelf
    ? "Create your first managed event to light up the planet."
    : "Public managed events will light up this planet.";

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-cyan-100/15 bg-slate-950/70 px-4 py-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:px-6 sm:py-8 lg:px-9">
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(20rem,1.18fr)] lg:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-4">
              <ProfileAvatar profile={profile} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100">
                  {isSelf ? "Your Planet" : "User Planet"}
                </p>
                {meta || (isSelf && profile.email) ? (
                  <p className="mt-1 truncate text-sm text-slate-400">
                    {meta ?? profile.email}
                  </p>
                ) : null}
              </div>
            </div>

            <h1 className="mt-7 max-w-2xl break-words text-[clamp(2.35rem,11vw,4.25rem)] font-semibold leading-[0.98] text-white">
              {displayName}&apos;s Planet
            </h1>

            {actionSlot ? <div className="mt-7">{actionSlot}</div> : null}
            {isSelf ? (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <LinkButton className="w-full sm:w-auto" href="/dashboard">
                  Open Dashboard
                </LinkButton>
              </div>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[35rem]">
            <div className="overflow-hidden rounded-[1.5rem] border border-cyan-100/15 bg-slate-950/55 shadow-xl shadow-black/20">
              <div className="grid gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                      Level {planetLevel.level}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {planetLevel.name}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-slate-300">
                    {nextLevel ? `${events.length}/${nextLevel.target} EXP` : "Max EXP"}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.7)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <HolographicPlanetGlobe
                emptyText={emptySignalText}
                signals={globeSignals}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileAvatar({ profile }: { profile: Profile }) {
  const label = profile.displayName ?? profile.email ?? "Evespace user";

  if (profile.avatarUrl) {
    return (
      <Image
        alt={`${label} avatar`}
        className="size-16 shrink-0 rounded-full border border-cyan-100/30 object-cover shadow-[0_0_28px_rgba(34,211,238,0.22)]"
        height={64}
        src={profile.avatarUrl}
        unoptimized
        width={64}
      />
    );
  }

  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-100/10 text-2xl font-semibold text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.22)]">
      {label.slice(0, 1)}
    </div>
  );
}

function toGlobeSignal(event: Event): PlanetGlobeSignal {
  const eventSummary =
    event.description?.trim() || compactDateLocation(event.startTime, event.locationName);

  return {
    href: getEventHref(event),
    id: event.id,
    summary: eventSummary,
    title: event.title,
  };
}

function getPlanetLevel(eventCount: number) {
  if (eventCount >= 6) {
    return PLANET_LEVELS[2];
  }

  if (eventCount >= 2) {
    return PLANET_LEVELS[1];
  }

  return PLANET_LEVELS[0];
}

function getNextLevel(eventCount: number) {
  if (eventCount < 2) {
    return { name: PLANET_LEVELS[1].name, target: 2 };
  }

  if (eventCount < 6) {
    return { name: PLANET_LEVELS[2].name, target: 6 };
  }

  return null;
}

function getEventHref(event: Event) {
  if (event.boardType !== "official_event") {
    return `/boards/${event.id}`;
  }

  if (event.visibility === "public" && event.verificationStatus === "verified") {
    return `/events/${event.slug}`;
  }

  return `/dashboard/events/${event.id}/moderation`;
}
