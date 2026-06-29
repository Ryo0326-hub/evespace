import { notFound, redirect } from "next/navigation";
import { updatePrivateBoardAction } from "@/app/actions/boards";
import { BoardForm } from "@/components/boards/BoardForm";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
import { canManageBoard, getBoardById } from "@/lib/data/boards";

export default async function EditBoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const board = await getBoardById(boardId);

  if (!board || board.boardType !== "private_memory") {
    notFound();
  }

  if (!(await canManageBoard(board.id, profile))) {
    redirect(`/boards/${board.id}`);
  }

  const background = getBoardTheme(board.boardBackgroundTheme);

  return (
    <main
      data-board-theme-page
      className={`${background.pageClassName} min-h-screen overflow-x-clip px-4 py-8 text-black sm:px-8`}
    >
      <div className="evespace-form-shell">
        <LinkButton
          className="memory-board-soft-button w-full sm:w-auto"
          href={`/boards/${board.id}`}
          variant="ghost"
        >
          Back to Board
        </LinkButton>
        <header className="memory-board-title-card my-8 rounded-[2rem] p-5 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-600">
            Edit Memory Board
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-black sm:text-6xl">
            <span className="memory-board-title-mark">{board.title}</span>
          </h1>
        </header>
        <BoardForm action={updatePrivateBoardAction} board={board} />
      </div>
    </main>
  );
}
