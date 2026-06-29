import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteBoardButton } from "@/components/boards/DeleteBoardButton";
import { DeleteHostedOfficialEventButton } from "@/components/official-events/DeleteHostedOfficialEventButton";
import { EventVerificationBadge } from "@/components/events/EventVerificationBadge";
import { boardAccessLabel } from "@/lib/boards/labels";
import { getBoardTheme } from "@/lib/board-themes";
import { cn, compactDateLocation } from "@/lib/utils";
import type { Board } from "@/types/evespace";

export function DashboardBoardCard({
  board,
  canDelete = false,
  canEdit = true,
  themeOverride,
}: {
  board: Board;
  canDelete?: boolean;
  canEdit?: boolean;
  themeOverride?: Board["boardBackgroundTheme"];
}) {
  const background = getBoardTheme(themeOverride ?? board.boardBackgroundTheme);
  const href =
    board.boardType === "official_event" ? `/official-events/${board.id}` : `/boards/${board.id}`;

  return (
    <Card
      className={cn(
        "dashboard-board-card relative isolate grid gap-5 overflow-hidden rounded-[1.5rem] p-4 text-white sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
        background.boardClassName,
      )}
    >
      <span className="dashboard-board-theme-wash" aria-hidden="true" />
      <div className="relative z-10 flex min-w-0 gap-4">
        <div
          className={cn(
            "dashboard-board-preview relative size-16 shrink-0 overflow-hidden rounded-[1.15rem] sm:size-20",
            background.previewClassName,
          )}
        >
          <span className="dashboard-board-preview-sheen" aria-hidden="true" />
          <span
            className="dashboard-board-preview-line dashboard-board-preview-line-one"
            aria-hidden="true"
          />
          <span
            className="dashboard-board-preview-line dashboard-board-preview-line-two"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 pt-1">
          <p className="min-w-0 text-xl font-semibold leading-tight text-white [overflow-wrap:anywhere] sm:text-2xl">
            {board.title}
          </p>
          {board.boardType === "official_event" ? (
            <span className="mt-2 inline-flex">
              <EventVerificationBadge status={board.verificationStatus} />
            </span>
          ) : (
            <p className="dashboard-board-pill mt-2 inline-flex">
              {boardAccessLabel(board)}
            </p>
          )}
          <p className="mt-2 text-sm font-medium text-slate-300">
            {compactDateLocation(board.startTime, board.locationName)}
          </p>
          {board.ownerDisplayName ? (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              by {board.ownerDisplayName}
            </p>
          ) : null}
        </div>
      </div>
      <div className="relative z-10 flex min-w-0 flex-wrap gap-2 md:justify-end">
        <LinkButton className="dashboard-board-action" href={href}>
          {board.boardType === "official_event" ? "Open Page" : "Open Board"}
        </LinkButton>
        {canEdit && board.boardType === "private_memory" ? (
          <LinkButton
            className="dashboard-board-action dashboard-board-secondary-action"
            href={`/boards/${board.id}/edit`}
            variant="secondary"
          >
            Edit
          </LinkButton>
        ) : null}
        {canDelete && board.boardType === "private_memory" ? (
          <DeleteBoardButton boardId={board.id} boardTitle={board.title} />
        ) : null}
        {canDelete && board.boardType === "official_event" ? (
          <DeleteHostedOfficialEventButton boardId={board.id} boardTitle={board.title} />
        ) : null}
      </div>
    </Card>
  );
}
