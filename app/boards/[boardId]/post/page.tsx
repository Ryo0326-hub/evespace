import { notFound, redirect } from "next/navigation";
import { createPrivateBoardMemoryPostAction } from "@/app/actions/memories";
import { MemoryPostForm } from "@/components/board/MemoryPostForm";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  canPostToBoard,
  getAccessibleBoardById,
} from "@/lib/data/boards";

export default async function CreatePrivateBoardPostPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const board = await getAccessibleBoardById(boardId, profile);

  if (!board || board.boardType !== "private_memory") {
    notFound();
  }

  if (!(await canPostToBoard(board, profile))) {
    redirect(`/boards/${board.id}`);
  }

  const action = createPrivateBoardMemoryPostAction.bind(null, board.id);

  return (
    <main className="cosmic-bg min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl min-w-0">
        <LinkButton className="w-full sm:w-auto" href={`/boards/${board.id}`} variant="ghost">
          Back to Board
        </LinkButton>

        <header className="my-7 max-w-3xl sm:my-10">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Create Memory
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Post to {board.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Upload a photo, doodle on it, add a caption, and submit.
          </p>
        </header>

        <MemoryPostForm action={action} />
      </div>
    </main>
  );
}
