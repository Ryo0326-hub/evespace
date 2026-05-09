import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/Button";
import { cn, compactDateLocation, formatDate } from "@/lib/utils";
import type { Event, Profile } from "@/types/evespace";

type PlanetLevel = {
  level: 1 | 2 | 3;
  name: string;
  src: string;
  description: string;
};

const PLANET_LEVELS: PlanetLevel[] = [
  {
    level: 1,
    name: "Seed Planet",
    src: "/planets/level1-hologram.png",
    description: "A quiet hologram with room for the first event signals.",
  },
  {
    level: 2,
    name: "Living Planet",
    src: "/planets/level2-hologram.png",
    description: "Paths, wildlife, and landmarks begin to appear as events grow.",
  },
  {
    level: 3,
    name: "Constellation Planet",
    src: "/planets/level3-hologram.png",
    description: "A bright world packed with event objects, routes, and life.",
  },
];

const SIGNAL_POINTS = [
  { x: 50, y: 24, size: "lg" },
  { x: 34, y: 39, size: "md" },
  { x: 61, y: 44, size: "sm" },
  { x: 44, y: 54, size: "md" },
  { x: 67, y: 57, size: "lg" },
  { x: 30, y: 58, size: "sm" },
  { x: 52, y: 66, size: "md" },
  { x: 41, y: 72, size: "sm" },
  { x: 58, y: 75, size: "md" },
  { x: 72, y: 35, size: "sm" },
  { x: 27, y: 47, size: "md" },
  { x: 48, y: 34, size: "sm" },
] as const;

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
  const visibleSignals = events.slice(0, SIGNAL_POINTS.length);
  const featuredEvents = events.slice(0, 5);
  const displayName = profile.displayName ?? "Evespace Explorer";
  const isSelf = mode === "self";
  const emptySignalText = isSelf
    ? "Create your first managed event to light up the planet."
    : "Public managed events will light up this planet.";

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-slate-950/70 px-4 py-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:px-6 sm:py-8 lg:px-9">
        <div className="planet-scanline pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)] lg:items-center">
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

            <h1 className="mt-7 max-w-2xl break-words text-[clamp(2.5rem,12vw,4.75rem)] font-semibold leading-[0.95] text-white">
              {displayName}&apos;s Planet
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              {isSelf
                ? "Every official event you manage becomes a glowing signal in this hologram. The more you build, the more alive your world becomes."
                : `Every public event ${displayName} manages becomes a glowing signal in this hologram.`}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <PlanetStat label="Level" value={`0${planetLevel.level}`} />
              <PlanetStat
                label={isSelf ? "Managed events" : "Public events"}
                value={events.length.toString()}
              />
              <PlanetStat
                label="Planet state"
                value={planetLevel.name}
                valueClassName="text-cyan-100"
              />
            </div>

            {actionSlot ? <div className="mt-7">{actionSlot}</div> : null}
            {isSelf ? (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <LinkButton className="w-full text-black sm:w-auto" href="/dashboard">
                  Open Dashboard
                </LinkButton>
                <LinkButton
                  className="w-full sm:w-auto"
                  href="/dashboard/official-events"
                  variant="secondary"
                >
                  Manage Events
                </LinkButton>
              </div>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[34rem]">
            <div className="planet-hologram relative mx-auto aspect-[1023/1537] w-full overflow-visible">
              <Image
                alt={`${planetLevel.name} holographic event planet`}
                className="object-contain drop-shadow-[0_0_38px_rgba(34,211,238,0.34)]"
                fill
                priority
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 70vw, 94vw"
                src={planetLevel.src}
              />
              {visibleSignals.map((event, index) => (
                <PlanetSignal event={event} index={index} key={event.id} />
              ))}
              {events.length === 0 ? (
                <div className="absolute left-1/2 top-[56%] z-20 w-[min(78%,18rem)] -translate-x-1/2 rounded-2xl border border-dashed border-cyan-100/30 bg-slate-950/70 px-4 py-3 text-center text-sm font-medium text-cyan-50 backdrop-blur">
                  {emptySignalText}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Hologram Signals
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The planet highlights the most recent managed events as active
                signals.
              </p>
            </div>
            {events.length > SIGNAL_POINTS.length ? (
              <span className="rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                +{events.length - SIGNAL_POINTS.length} more in orbit
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3">
            {featuredEvents.map((event, index) => (
              <Link
                className="group grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-100/30 hover:bg-cyan-100/[0.07] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                href={getEventHref(event)}
                key={event.id}
              >
                <span className="flex size-10 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-100/10 text-sm font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-white group-hover:text-cyan-100">
                    {event.title}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-400">
                    {compactDateLocation(event.startTime, event.locationName)}
                  </span>
                </span>
                <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                  {event.verificationStatus === "verified" ? "Verified" : "Signal"}
                </span>
              </Link>
            ))}

            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-5 text-sm leading-6 text-slate-300">
                {isSelf
                  ? "No managed event signals yet. Once you create or administer an official event, it will appear on your planet."
                  : "No public managed event signals are visible yet."}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-cyan-100/15 bg-cyan-100/[0.06] p-5 shadow-xl shadow-cyan-950/20 backdrop-blur sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100">
            Planet Growth
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {planetLevel.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {planetLevel.description}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>Current charge</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-slate-950/70">
              <div
                className="h-full rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <p className="text-sm font-semibold text-white">Next evolution</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {nextLevel
                ? `${Math.max(
                    nextLevel.target - events.length,
                    0,
                  )} more ${isSelf ? "managed" : "public"} event${
                    nextLevel.target - events.length === 1 ? "" : "s"
                  } to reach ${nextLevel.name}.`
                : isSelf
                  ? "Your planet is fully alive. New events will keep adding more signals."
                  : "This planet is fully alive. New public events will keep adding more signals."}
            </p>
          </div>

          {events[0] ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm font-semibold text-white">Latest signal</p>
              <p className="mt-2 truncate text-base font-semibold text-cyan-50">
                {events[0].title}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {formatDate(events[0].startTime)}
              </p>
            </div>
          ) : null}
        </aside>
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

function PlanetStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 truncate text-2xl font-semibold text-white",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PlanetSignal({
  event,
  index,
}: {
  event: Event;
  index: number;
}) {
  const point = SIGNAL_POINTS[index];
  const sizeClass =
    point.size === "lg" ? "size-5" : point.size === "md" ? "size-4" : "size-3";

  return (
    <Link
      aria-label={`Open ${event.title}`}
      className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      href={getEventHref(event)}
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
      }}
    >
      <span
        className={cn(
          "planet-signal rounded-full border border-white bg-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.92)] transition group-hover:scale-125 group-focus-visible:scale-125",
          sizeClass,
        )}
        style={{ animationDelay: `${index * 180}ms` }}
      />
      <span className="pointer-events-none absolute left-1/2 top-full mt-2 hidden max-w-48 -translate-x-1/2 truncate rounded-xl border border-cyan-100/20 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-cyan-50 shadow-2xl shadow-cyan-950/30 backdrop-blur group-hover:block group-focus-visible:block">
        {event.title}
      </span>
    </Link>
  );
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
