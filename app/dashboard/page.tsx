import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  getFriendBoards,
  getOwnedOfficialBoards,
  getOwnedPrivateBoards,
} from "@/lib/data/boards";
import {
  getFollowerProfiles,
  getFollowingProfiles,
  getFollowCounts,
} from "@/lib/data/follows";
import { DashboardBoardCard } from "@/components/boards/DashboardBoardCard";
import { FriendsBoardsFeed } from "@/components/boards/FriendsBoardsFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Profile } from "@/types/evespace";

type PeopleListMode = "following" | "followers";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ people?: string }>;
}) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const peopleMode = readPeopleMode((await searchParams)?.people);
  const [
    myBoards,
    friendBoards,
    officialSites,
    followCounts,
    followingProfiles,
    followerProfiles,
  ] = await Promise.all([
    getOwnedPrivateBoards(profile.clerkUserId),
    getFriendBoards(profile),
    getOwnedOfficialBoards(profile),
    getFollowCounts(profile.id),
    getFollowingProfiles(profile.id),
    getFollowerProfiles(profile.id),
  ]);
  const hostOfficialEventHref = "/premium?next=/official-events/new";

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-6xl">
        <header className="dashboard-desktop-header grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-start sm:justify-between lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="evespace-page-header">
            <p className="evespace-kicker">
              Dashboard
            </p>
          </div>
          <div className="dashboard-action-stack grid w-full gap-2 sm:w-64 lg:w-auto lg:grid-cols-[17.75rem_10rem_15rem] lg:items-center lg:justify-end">
            <div className="dashboard-follow-grid grid grid-cols-2 gap-2 lg:grid-cols-[8.75rem_8.75rem]">
              <FollowStatLink
                active={peopleMode === "following"}
                count={followCounts.following}
                href="/dashboard?people=following"
                label="Following"
              />
              <FollowStatLink
                active={peopleMode === "followers"}
                count={followCounts.followers}
                href="/dashboard?people=followers"
                label="Followers"
              />
            </div>
            <LinkButton className="dashboard-primary-action w-full gap-2 lg:min-h-12" href="/boards/new">
              Create
              <Image
                alt=""
                aria-hidden="true"
                className="h-7 w-7 shrink-0 object-contain"
                height={28}
                src="/dashboard-icons/create.png"
                width={28}
              />
            </LinkButton>
            <LinkButton
              className="dashboard-primary-action w-full gap-2 lg:min-h-12"
              href={hostOfficialEventHref}
              variant="secondary"
            >
              Host an official event
              <Image
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0 object-contain"
                height={32}
                src="/dashboard-icons/host.png"
                width={32}
              />
            </LinkButton>
          </div>
        </header>

        {peopleMode ? (
          <PeopleListPanel
            mode={peopleMode}
            people={peopleMode === "following" ? followingProfiles : followerProfiles}
          />
        ) : null}

        <div className="grid gap-8">
          <section className="evespace-section">
            <div className="evespace-section-header">
              <h2 className="dashboard-section-title">My Memory Boards</h2>
            </div>
            {myBoards.length === 0 ? (
              <EmptyState
                title="You have not created any memory boards yet."
                description="Create a private board for a trip, event, or memory you want to keep."
              />
            ) : (
              <div className="grid gap-4">
                {myBoards.map((board) => (
                  <DashboardBoardCard board={board} canDelete key={board.id} />
                ))}
              </div>
            )}
          </section>

          <section className="evespace-section">
            <div className="evespace-section-header">
              <h2 className="dashboard-section-title">
                Friends&apos; Memory Boards
              </h2>
            </div>
            <FriendsBoardsFeed boards={friendBoards} />
          </section>

          <section className="evespace-section">
            <div className="evespace-section-header">
              <h2 className="dashboard-section-title">Official Sites</h2>
            </div>
            {officialSites.length === 0 ? (
              <EmptyState
                title="No official sites yet."
                description="Official event pages you host will appear here."
              />
            ) : (
              <div className="grid gap-4">
                {officialSites.map((board) => (
                  <DashboardBoardCard
                    board={board}
                    canDelete
                    canEdit={false}
                    key={board.id}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function readPeopleMode(value?: string): PeopleListMode | null {
  return value === "following" || value === "followers" ? value : null;
}

function FollowStatLink({
  active,
  count,
  href,
  label,
}: {
  active: boolean;
  count: number;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-pressed={active}
      className={`dashboard-follow-button inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-cyan-100/70 bg-cyan-100 text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.22)]"
          : "border-white/12 bg-white/[0.07] text-slate-200 hover:border-cyan-100/40 hover:bg-cyan-100/10 hover:text-white"
      }`}
      href={href}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <Image
          alt=""
          aria-hidden="true"
          className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7"
          height={24}
          src="/dashboard-icons/friends.png"
          width={24}
        />
        <span className="truncate">{label}</span>
      </span>
      <span className={active ? "shrink-0 text-slate-950" : "shrink-0 text-cyan-100"}>
        {count}
      </span>
    </Link>
  );
}

function PeopleListPanel({
  mode,
  people,
}: {
  mode: PeopleListMode;
  people: Profile[];
}) {
  const title = mode === "following" ? "Following" : "Followers";

  return (
    <Card className="mb-8 border-cyan-100/20 bg-slate-950/70 p-4 shadow-cyan-950/20 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="evespace-section-kicker">
            {title}
          </p>
          <h2 className="evespace-subsection-title mt-1">
            {people.length} {people.length === 1 ? "person" : "people"}
          </h2>
        </div>
        <Link
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/15 hover:text-white"
          href="/dashboard"
        >
          Close
        </Link>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {people.map((person) => (
          <Link
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 transition hover:border-cyan-100/30 hover:bg-cyan-100/[0.08]"
            href={`/user/${person.id}`}
            key={person.id}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-cyan-100/25 bg-cyan-100/10 text-sm font-bold text-cyan-100">
              {(person.displayName ?? person.email ?? "E").slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {person.displayName ?? "Evespace User"}
              </p>
              {person.email ? (
                <p className="truncate text-xs text-slate-400">{person.email}</p>
              ) : null}
            </div>
          </Link>
        ))}
        {people.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-300 sm:col-span-2">
            No {title.toLowerCase()} yet.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
