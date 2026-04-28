import { notFound, redirect } from "next/navigation";
import { updatePrivateBoardAction } from "@/app/actions/boards";
import { BoardForm } from "@/components/boards/BoardForm";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
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

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <LinkButton href={`/boards/${board.id}`} variant="ghost">
          Back to Board
        </LinkButton>
        <header className="my-8">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Edit Memory Board
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{board.title}</h1>
        </header>
        <BoardForm action={updatePrivateBoardAction} board={board} />
      </div>
    </main>
  );
}
