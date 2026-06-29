"use client";

import { deletePrivateBoardAction } from "@/app/actions/boards";

export function DeleteBoardButton({
  boardId,
  boardTitle,
}: {
  boardId: string;
  boardTitle: string;
}) {
  return (
    <form
      className="min-w-0"
      action={deletePrivateBoardAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete "${boardTitle}"? This will remove the board and its memories.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="boardId" type="hidden" value={boardId} />
      <button
        className="dashboard-board-action dashboard-board-danger-action inline-flex min-h-11 min-w-0 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition"
        type="submit"
      >
        Delete
      </button>
    </form>
  );
}
