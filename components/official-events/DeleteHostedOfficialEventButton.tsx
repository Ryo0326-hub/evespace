"use client";

import { deleteHostedOfficialEventAction } from "@/app/actions/official-events";

export function DeleteHostedOfficialEventButton({
  boardId,
  boardTitle,
}: {
  boardId: string;
  boardTitle: string;
}) {
  return (
    <form
      action={deleteHostedOfficialEventAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete "${boardTitle}"? This will remove the official page and its event memories.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input name="boardId" type="hidden" value={boardId} />
      <button
        className="memory-board-danger-button inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-black transition"
        type="submit"
      >
        Delete
      </button>
    </form>
  );
}
