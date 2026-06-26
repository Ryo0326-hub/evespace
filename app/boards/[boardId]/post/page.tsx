import { notFound, redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { createPrivateBoardMemoryPostAction } from "@/app/actions/memories";
import { MemoryPostForm } from "@/components/board/MemoryPostForm";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
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
  const { userId } = await auth();
  const profile = userId ? await ensureUserProfile() : null;
  const board = await getAccessibleBoardById(boardId, profile);

  if (!board || board.boardType !== "private_memory") {
    notFound();
  }

  const background = getBoardTheme(board.boardBackgroundTheme);

  if (!profile) {
    return (
      <main className={`${background.pageClassName} memory-create-page flex min-h-screen items-center justify-center px-4`}>
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold text-[#2b1d17]">
            Sign in to post a memory.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#725a4d]">
            You can view this board, but posting a memory requires an Evespace
            account.
          </p>
          <span className="memory-scrapbook-sign-in">
            <SignInButton mode="modal">Sign in</SignInButton>
          </span>
        </Card>
      </main>
    );
  }

  if (!(await canPostToBoard(board, profile))) {
    redirect(`/boards/${board.id}`);
  }

  const action = createPrivateBoardMemoryPostAction.bind(null, board.id);

  return (
    <main className={`${background.pageClassName} memory-create-page min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8`}>
      <div className="mx-auto w-full max-w-5xl min-w-0">
        <LinkButton
          className="memory-create-back-button w-full sm:w-auto"
          href={`/boards/${board.id}`}
          variant="ghost"
        >
          Back to Board
        </LinkButton>

        <header className="my-7 max-w-3xl sm:my-10">
          <h1 className="break-words text-3xl font-black tracking-normal text-[#2b1d17] sm:text-5xl">
            Post to {board.title}
          </h1>
        </header>

        <MemoryPostForm action={action} />
      </div>
    </main>
  );
}
