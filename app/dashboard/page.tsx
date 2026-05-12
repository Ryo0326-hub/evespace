import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getFriendBoards, getOwnedPrivateBoards } from "@/lib/data/boards";
import { getFollowCounts } from "@/lib/data/follows";
import { DashboardBoardCard } from "@/components/boards/DashboardBoardCard";
import { FriendsBoardsFeed } from "@/components/boards/FriendsBoardsFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export default async function DashboardPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const [myBoards, friendBoards, followCounts] = await Promise.all([
    getOwnedPrivateBoards(profile.clerkUserId),
    getFriendBoards(profile),
    getFollowCounts(profile.id),
  ]);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">
              Your Memory Space
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              {followCounts.following} following · {followCounts.followers} followers
            </p>
          </div>
          <div className="grid w-full gap-2 sm:w-64">
            <LinkButton className="w-full" href="/boards/new">
              Create
            </LinkButton>
            <LinkButton
              className="w-full border-cyan-200/35 bg-cyan-100/10 text-cyan-50 shadow-[0_0_24px_rgba(103,232,249,0.14)] hover:border-cyan-100/60 hover:bg-cyan-100/18 hover:text-white"
              href="/official-events/new"
              variant="secondary"
            >
              Host an official event
            </LinkButton>
          </div>
        </header>

        <div className="grid gap-8">
          <section className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-white">My Memory Boards</h2>
              <LinkButton href="/boards/new" variant="ghost">
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

          <section className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold text-white">
                Friends&apos; Memory Boards
              </h2>
              <LinkButton href="/dashboard/friends" variant="ghost">
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
