import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DeleteBoardButton } from "@/components/boards/DeleteBoardButton";
import { boardBackgrounds } from "@/lib/constants";
import { cn, compactDateLocation } from "@/lib/utils";
import type { Board } from "@/types/evespace";

export function DashboardBoardCard({
  board,
  canDelete = false,
}: {
  board: Board;
  canDelete?: boolean;
}) {
  const background = boardBackgrounds[board.boardBackgroundTheme];
  const typeLabel =
    board.boardType === "official_event" ? "Official Event" : "Private Memory Board";
  const href =
    board.boardType === "official_event" ? `/events/${board.slug}` : `/boards/${board.id}`;

  return (
    <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex gap-4">
        <div
          className={cn(
            "h-16 w-16 shrink-0 rounded-2xl border border-black/20",
            background.swatchClassName,
          )}
        />
        <div>
          <p className="text-xl font-semibold text-white">{board.title}</p>
          <p className="mt-1 text-sm text-slate-400">
            {typeLabel} · {sharingLabel(board.sharingScope)}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {compactDateLocation(board.startTime, board.locationName)}
          </p>
          {board.ownerDisplayName ? (
            <p className="mt-1 text-xs text-slate-500">by {board.ownerDisplayName}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <LinkButton href={href}>
          Open Board
        </LinkButton>
        {board.boardType === "private_memory" ? (
          <LinkButton href={`/boards/${board.id}/edit`} variant="secondary">
            Edit
          </LinkButton>
        ) : null}
        {canDelete && board.boardType === "private_memory" ? (
          <DeleteBoardButton boardId={board.id} boardTitle={board.title} />
        ) : null}
      </div>
    </Card>
  );
}

function sharingLabel(value: Board["sharingScope"]) {
  if (value === "followers") {
    return "Shared with followers";
  }

  if (value === "public") {
    return "Public link";
  }

  if (value === "selected_users") {
    return "Selected users";
  }

  return "Owner only";
}
