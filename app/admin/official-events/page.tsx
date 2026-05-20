import { redirect } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventVerificationBadge } from "@/components/events/EventVerificationBadge";
import { requirePlatformAdmin } from "@/lib/auth/permissions";
import { getManagedOfficialBoards } from "@/lib/data/boards";

export default async function AdminOfficialEventsPage() {
  let profile;
  try {
    profile = await requirePlatformAdmin();
  } catch {
    redirect("/dashboard");
  }

  const boards = await getManagedOfficialBoards(profile);

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="evespace-page-header">
            <LinkButton href="/admin" variant="ghost">
              Back to Admin
            </LinkButton>
            <p className="evespace-kicker mt-6">
              Official Events
            </p>
            <h1 className="evespace-page-title">
              Manage official event stars
            </h1>
          </div>
          <LinkButton href="/admin/official-events/new">Create Official Event</LinkButton>
        </header>

        {boards.length === 0 ? (
          <EmptyState
            title="No official events yet."
            description="Create the first verified event star from this admin area."
          />
        ) : (
          <div className="grid gap-4">
            {boards.map((board) => (
              <Card
                className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center"
                key={board.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="evespace-card-title">{board.title}</p>
                    <EventVerificationBadge status={board.verificationStatus} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {board.visibility} · {board.moderationMode.replace("_", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/official-events/${board.id}`} variant="ghost">
                    View
                  </LinkButton>
                  <LinkButton
                    href={`/admin/official-events/${board.id}/edit`}
                    variant="secondary"
                  >
                    Edit
                  </LinkButton>
                  <LinkButton
                    href={`/dashboard/events/${board.id}/moderation`}
                    variant="secondary"
                  >
                    Moderate
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
