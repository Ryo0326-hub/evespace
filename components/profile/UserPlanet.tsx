import Image from "next/image";
import type { ReactNode } from "react";
import {
  HolographicPlanetGlobe,
  type PlanetGlobeSignal,
} from "@/components/profile/HolographicPlanetGlobe";
import { LinkButton } from "@/components/ui/Button";
import { getPlanetLevelInfo } from "@/lib/planet/planet-levels";
import { getPremiumStatus } from "@/lib/premium/premium-utils.mjs";
import { compactDateLocation } from "@/lib/utils";
import type { Event, Profile } from "@/types/evespace";

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
  const planetLevel = getPlanetLevelInfo(events.length);
  const globeSignals = events.map(toGlobeSignal);
  const displayName = profile.displayName ?? "Evespace Explorer";
  const isSelf = mode === "self";
  const premiumStatus = getPremiumStatus(profile);
  const emptySignalText = isSelf
    ? "Create your first managed event to light up the planet."
    : "Public managed events will light up this planet.";

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-cyan-100/15 bg-slate-950/70 px-4 py-6 backdrop-blur-xl sm:px-6 sm:py-8 lg:px-9">
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(20rem,1.18fr)] lg:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-4">
              <ProfileAvatar profile={profile} />
              <div className="min-w-0">
                {premiumStatus.isPremium ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/45 bg-amber-200/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-amber-100">
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="h-5 w-5 object-contain"
                        height={20}
                        src="/dashboard-icons/premium.png"
                        width={20}
                      />
                      Premium
                    </span>
                  </div>
                ) : null}
                {meta || (isSelf && profile.email) ? (
                  <p className={premiumStatus.isPremium ? "mt-1 truncate text-sm text-slate-400" : "truncate text-sm text-slate-400"}>
                    {meta ?? profile.email}
                  </p>
                ) : null}
              </div>
            </div>

            <h1 className="mt-7 max-w-2xl break-words text-[clamp(2.35rem,11vw,4.25rem)] font-semibold leading-[0.98] text-white">
              {displayName}&apos;s Planet
            </h1>

            {premiumStatus.isPremium ? (
              <div className="mt-5 rounded-3xl border border-amber-200/30 bg-amber-200/[0.09] px-4 py-3 text-sm leading-6 text-amber-50">
                EveSpace Premium is active. Official event hosting and premium
                stickers are unlocked.
              </div>
            ) : null}

            {actionSlot ? <div className="mt-7">{actionSlot}</div> : null}
            {isSelf ? (
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <LinkButton className="w-full gap-2 shadow-none sm:w-auto" href="/dashboard">
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="h-7 w-7 shrink-0 object-contain"
                    height={28}
                    src="/dashboard-icons/dashboard.png"
                    width={28}
                  />
                  Open Dashboard
                </LinkButton>
              </div>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[35rem]">
            <div className="overflow-hidden rounded-[1.5rem] border border-cyan-100/15 bg-slate-950/55">
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
                    {planetLevel.nextLevelTarget
                      ? `${events.length}/${planetLevel.nextLevelTarget} EXP`
                      : "Max EXP"}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-200"
                    style={{ width: `${planetLevel.progress}%` }}
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
        className="size-16 shrink-0 rounded-full border border-cyan-100/30 object-cover"
        height={64}
        src={profile.avatarUrl}
        unoptimized
        width={64}
      />
    );
  }

  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-cyan-100/30 bg-cyan-100/10 text-2xl font-semibold text-cyan-100">
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

function getEventHref(event: Event) {
  if (event.boardType !== "official_event") {
    return `/boards/${event.id}`;
  }

  return `/official-events/${event.id}`;
}
