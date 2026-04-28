import { redirect } from "next/navigation";
import {
  rejectEventVerificationAction,
  verifyEventAction,
} from "@/app/actions/admin";
import { EventVerificationBadge } from "@/components/events/EventVerificationBadge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePlatformAdmin } from "@/lib/auth/permissions";
import { getPendingOfficialBoards } from "@/lib/data/boards";

export default async function AdminVerificationPage() {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/dashboard");
  }

  const boards = await getPendingOfficialBoards();

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header>
          <LinkButton href="/admin" variant="ghost">
            Back to Admin
          </LinkButton>
          <p className="mt-8 text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Verification
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Pending official events
          </h1>
        </header>

        {boards.length === 0 ? (
          <EmptyState
            title="No verification requests."
            description="Official event submissions waiting for Evespace approval will appear here."
          />
        ) : (
          <div className="grid gap-4">
            {boards.map((board) => (
              <Card key={board.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-white">{board.title}</h2>
                      <EventVerificationBadge status={board.verificationStatus} />
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      {board.description ?? "No description provided."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <LinkButton href={`/admin/official-events/${board.id}/edit`} variant="secondary">
                        Review Details
                      </LinkButton>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={verifyEventAction.bind(null, board.id)}>
                      <Button type="submit">Verify</Button>
                    </form>
                    <form action={rejectEventVerificationAction.bind(null, board.id, "Rejected by admin.")}>
                      <Button type="submit" variant="danger">
                        Reject
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
