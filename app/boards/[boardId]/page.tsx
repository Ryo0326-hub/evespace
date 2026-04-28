import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FollowButton } from "@/components/social/FollowButton";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { StickerStoreButton } from "@/components/board/StickerStoreButton";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { boardBackgrounds } from "@/lib/constants";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  canManageBoard,
  canPostToBoard,
  getAccessibleBoardById,
} from "@/lib/data/boards";
import { getApprovedMemoryPostsByBoard } from "@/lib/data/memory-posts";
import { isFollowing } from "@/lib/data/follows";
import { compactDateLocation } from "@/lib/utils";

export default async function PrivateBoardPage({
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

  const [posts, canManage, canPost, followingOwner] = await Promise.all([
    getApprovedMemoryPostsByBoard(board.id),
    canManageBoard(board.id, profile),
    canPostToBoard(board, profile),
    profile && board.ownerProfileId && board.ownerProfileId !== profile.id
      ? isFollowing(profile.id, board.ownerProfileId)
      : Promise.resolve(false),
  ]);

  const background = boardBackgrounds[board.boardBackgroundTheme];

  return (
    <main className={`${background.className} min-h-dvh overflow-visible px-3 pb-24 pt-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8`}>
      <div className="mx-auto max-w-7xl">
        <nav className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between">
          <LinkButton className="w-full sm:w-auto" href="/dashboard" variant="secondary">
            Back to Dashboard
          </LinkButton>
          <div className="flex flex-wrap gap-2" id="memory-board-actions">
            {canPost ? (
              <LinkButton className="w-full sm:w-auto" href={`/boards/${board.id}/post`}>
                Post Memory
              </LinkButton>
            ) : !profile ? (
              <LinkButton className="w-full sm:w-auto" href="/login">
                Sign in to Post
              </LinkButton>
            ) : null}
            {canManage ? (
              <LinkButton
                className="w-full sm:w-auto"
                href={`/boards/${board.id}/edit`}
                variant="secondary"
              >
                Edit Board
              </LinkButton>
            ) : null}
            <StickerStoreButton />
          </div>
        </nav>

        <header className="my-7 grid gap-4 rounded-[2rem] border-2 border-black bg-white p-5 shadow-sm sm:my-10 sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
              Private Memory Board
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-black sm:text-6xl">
              {board.title}
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              {compactDateLocation(board.startTime, board.locationName)}
            </p>
            {board.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700">
                {board.description}
              </p>
            ) : null}
          </div>
          {profile && board.ownerProfileId && board.ownerProfileId !== profile.id ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">
                Shared by {board.ownerDisplayName ?? "an Evespace user"}
              </p>
              <FollowButton
                following={Boolean(followingOwner)}
                followingProfileId={board.ownerProfileId}
                returnPath={`/boards/${board.id}`}
              />
            </div>
          ) : null}
        </header>

        <Card className="border-black/10 bg-white/60 text-slate-950 shadow-sm">
          <MemoryBoard posts={posts} />
        </Card>
      </div>
    </main>
  );
}
