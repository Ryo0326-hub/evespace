import { notFound, redirect } from "next/navigation";
import {
  submitEventVerificationAction,
  updateEventAction,
} from "@/app/actions/events";
import { EventForm } from "@/components/admin/EventForm";
import { EventVerificationBadge } from "@/components/events/EventVerificationBadge";
import { LinkButton } from "@/components/ui/Button";
import { Button } from "@/components/ui/Button";
import { requirePlatformAdmin } from "@/lib/auth/permissions";
import { getBoardById } from "@/lib/data/boards";
import { getEventSchedules } from "@/lib/data/schedules";

export default async function EditOfficialEventPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  try {
    await requirePlatformAdmin();
  } catch {
    redirect("/dashboard");
  }

  const { boardId } = await params;
  const board = await getBoardById(boardId);

  if (!board || board.boardType !== "official_event") {
    notFound();
  }

  const schedules = await getEventSchedules(board.id);
  const scheduleText = schedules
    .map((item) =>
      [formatScheduleTime(item.startTime), item.title, item.locationName, item.description]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-5xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="evespace-page-header">
            <LinkButton href="/admin/official-events" variant="ghost">
              Back to Official Events
            </LinkButton>
            <p className="evespace-kicker mt-6">
              Edit Official Event
            </p>
            <h1 className="evespace-page-title">{board.title}</h1>
            <div className="mt-3">
              <EventVerificationBadge status={board.verificationStatus} />
            </div>
          </div>
          <LinkButton href={`/events/${board.slug}`} variant="secondary">
            View Public Page
          </LinkButton>
        </header>

        <EventForm action={updateEventAction} event={board} scheduleText={scheduleText} />

        {board.verificationStatus !== "verified" ? (
          <form action={submitEventVerificationAction}>
            <input name="eventId" type="hidden" value={board.id} />
            <Button type="submit" variant="secondary">
              Submit for Verification Review
            </Button>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function formatScheduleTime(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(11, 16);
}
