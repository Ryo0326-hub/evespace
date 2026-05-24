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
        "grid gap-5 overflow-hidden rounded-[2rem] border-[3px] border-black p-5 text-black shadow-[8px_8px_0_rgba(5,5,5,0.16)] backdrop-blur-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
        background.cardClassName,
      )}
    >
      <div className="flex min-w-0 gap-4">
        <div
          className={cn(
            "size-16 shrink-0 rounded-[1.35rem] border-2 border-black shadow-[3px_3px_0_rgba(5,5,5,0.16)] sm:size-20",
            background.previewClassName,
          )}
        />
        <div className="min-w-0 pt-1">
          <p className={cn("min-w-0 text-2xl font-black leading-tight [overflow-wrap:anywhere]", background.textClassName)}>
            {board.title}
          </p>
          {board.boardType === "official_event" ? (
            <span className="mt-2 inline-flex">
              <EventVerificationBadge status={board.verificationStatus} />
            </span>
          ) : (
            <p className={cn("mt-2 text-sm font-black", background.mutedTextClassName)}>
              {boardAccessLabel(board)}
            </p>
          )}
          <p className={cn("mt-2 text-sm font-semibold", background.mutedTextClassName)}>
            {compactDateLocation(board.startTime, board.locationName)}
          </p>
          {board.ownerDisplayName ? (
            <p className={cn("mt-1 text-xs font-bold", background.mutedTextClassName)}>
              by {board.ownerDisplayName}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
        <LinkButton className="memory-board-cute-button" href={href}>
          {board.boardType === "official_event" ? "Open Page" : "Open Board"}
        </LinkButton>
        {canEdit && board.boardType === "private_memory" ? (
          <LinkButton
            className="memory-board-soft-button"
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
