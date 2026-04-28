import { redirect } from "next/navigation";
import { DashboardBoardCard } from "@/components/boards/DashboardBoardCard";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getManagedOfficialBoards } from "@/lib/data/boards";

export default async function DashboardOfficialEventsPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const boards = await getManagedOfficialBoards(profile);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header>
          <LinkButton href="/dashboard" variant="ghost">
            Back to Dashboard
          </LinkButton>
          <p className="mt-8 text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Official Events
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Official event boards
          </h1>
        </header>
        {boards.length === 0 ? (
          <EmptyState
            title="No official events yet."
            description="Official public events are created by Evespace platform admins."
          />
        ) : (
          <div className="grid gap-4">
            {boards.map((board) => (
              <DashboardBoardCard board={board} key={board.id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
