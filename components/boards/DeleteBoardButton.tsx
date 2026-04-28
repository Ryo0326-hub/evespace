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
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-300/50 bg-red-500/15 px-5 py-2.5 text-sm font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/25"
        type="submit"
      >
        Delete
      </button>
    </form>
  );
}
