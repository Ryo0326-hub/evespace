import { redirect } from "next/navigation";
import Link from "next/link";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getFriendBoards, getOwnedPrivateBoards } from "@/lib/data/boards";
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
  const [myBoards, friendBoards, followCounts, followingProfiles, followerProfiles] =
    await Promise.all([
    getOwnedPrivateBoards(profile.clerkUserId),
    getFriendBoards(profile),
    getFollowCounts(profile.id),
    getFollowingProfiles(profile.id),
    getFollowerProfiles(profile.id),
  ]);

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-6xl">
        <header className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-end sm:justify-between">
          <div className="evespace-page-header">
            <p className="evespace-kicker">
              Dashboard
            </p>
            <h1 className="evespace-page-title">
              Your Memory Space
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
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
          </div>
          <div className="grid w-full gap-2 sm:w-64">
            <LinkButton className="w-full" href="/boards/new">
              Create
            </LinkButton>
            <LinkButton
              className="w-full"
              href="/official-events/new"
              variant="secondary"
            >
              Host an official event
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
              <h2 className="evespace-section-title">My Memory Boards</h2>
              <LinkButton
                className="memory-board-soft-button"
                href="/boards/new"
                variant="ghost"
              >
                New Board
              </LinkButton>
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
              <h2 className="evespace-section-title">
                Friends&apos; Memory Boards
              </h2>
              <LinkButton
                className="memory-board-soft-button"
                href="/dashboard/friends"
                variant="ghost"
              >
                View Friends
              </LinkButton>
            </div>
            <FriendsBoardsFeed boards={friendBoards} />
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
      className={`inline-flex min-h-11 min-w-[8.5rem] items-center justify-between gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-cyan-100/70 bg-cyan-100 text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.22)]"
          : "border-white/12 bg-white/[0.07] text-slate-200 hover:border-cyan-100/40 hover:bg-cyan-100/10 hover:text-white"
      }`}
      href={href}
    >
      <span>{label}</span>
      <span className={active ? "text-slate-950" : "text-cyan-100"}>{count}</span>
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
