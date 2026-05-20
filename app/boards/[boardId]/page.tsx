import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FollowButton } from "@/components/social/FollowButton";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { StickerStoreButton } from "@/components/board/StickerStoreButton";
import { LinkButton } from "@/components/ui/Button";
import { DEFAULT_BOARD_THEME, getBoardTheme } from "@/lib/board-themes";
import { sharingScopeLabel } from "@/lib/boards/labels";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import {
  canManageBoard,
  canPostToBoard,
  getAccessibleBoardById,
} from "@/lib/data/boards";
import {
  getApprovedMemoryPostsPageByBoard,
} from "@/lib/data/memory-posts";
import { getFollowRelationshipStatus } from "@/lib/data/follows";
import { cn, compactDateLocation } from "@/lib/utils";

const postMemoryActionClassName =
  "memory-board-cute-button w-full rounded-full px-5 py-2.5 text-sm font-black sm:w-auto";

export default async function PrivateBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardId: string }>;
  searchParams?: Promise<{ offset?: string }>;
}) {
  const { boardId } = await params;
  const offset = readOffset((await searchParams)?.offset);
  const { userId } = await auth();
  const profile = userId ? await ensureUserProfile() : null;
  const board = await getAccessibleBoardById(boardId, profile);

  if (!board || board.boardType !== "private_memory") {
    notFound();
  }

  const [postPage, canManage, canPost, followStatus] = await Promise.all([
    getApprovedMemoryPostsPageByBoard(board.id, { offset }),
    canManageBoard(board.id, profile),
    canPostToBoard(board, profile),
    profile && board.ownerProfileId && board.ownerProfileId !== profile.id
      ? getFollowRelationshipStatus(profile.id, board.ownerProfileId)
      : Promise.resolve<"none">("none"),
  ]);

  const viewerOwnsBoard = Boolean(profile?.id && board.ownerProfileId === profile.id);
  const background = getBoardTheme(
    viewerOwnsBoard ? board.boardBackgroundTheme : DEFAULT_BOARD_THEME,
  );

  return (
    <main className={`${background.pageClassName} min-h-dvh overflow-x-clip overflow-y-visible px-3 pb-24 pt-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8`}>
      <div className="mx-auto min-w-0 max-w-7xl">
        <nav className="grid min-w-0 grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between">
          <LinkButton
            className="memory-board-soft-button w-full sm:w-auto"
            href="/dashboard"
            variant="secondary"
          >
            Back to Dashboard
          </LinkButton>
          <div className="flex min-w-0 flex-wrap gap-2">
            {canPost ? (
              <LinkButton
                className={postMemoryActionClassName}
                href={`/boards/${board.id}/post`}
              >
                Post Memory
              </LinkButton>
            ) : !profile ? (
              <LinkButton className={postMemoryActionClassName} href="/login">
                Sign in to Post
              </LinkButton>
            ) : null}
            {canManage ? (
              <LinkButton
                className="memory-board-soft-button w-full sm:w-auto"
                href={`/boards/${board.id}/edit`}
                variant="secondary"
              >
                Edit Board
              </LinkButton>
            ) : null}
          </div>
        </nav>

        <header className="memory-board-title-card my-7 grid gap-4 rounded-[2rem] p-5 sm:my-10 sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-600">
              {sharingScopeLabel(board.sharingScope)}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-black sm:text-6xl">
              <span className="memory-board-title-mark">{board.title}</span>
            </h1>
            <p className="mt-4 text-sm font-bold text-slate-700">
              {compactDateLocation(board.startTime, board.locationName)}
            </p>
            {board.description ? (
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-700">
                {board.description}
              </p>
            ) : null}
          </div>
          {profile && board.ownerProfileId && board.ownerProfileId !== profile.id ? (
            <div className="memory-board-owner-panel mt-1 grid min-w-0 gap-3 rounded-2xl border-2 p-3 sm:flex sm:w-fit sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-600">
                  Shared by
                </p>
                <p className="mt-0.5 min-w-0 text-sm font-black text-slate-800">
                  {board.ownerDisplayName ?? "an Evespace user"}
                </p>
              </div>
              <FollowButton
                followingProfileId={board.ownerProfileId}
                returnPath={`/boards/${board.id}`}
                status={followStatus}
                tone="board"
              />
            </div>
          ) : null}
        </header>

        <div
          className={cn(
            "-mx-3 px-3 sticky top-14 z-[56] mb-4 mt-6 shrink-0 border-b border-black/15 py-3 shadow-sm backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
            background.navClassName,
          )}
          id="memory-board-actions"
        >
          <div className="flex justify-end">
            <StickerStoreButton />
          </div>
        </div>

        <div
          className={cn(
            "overflow-x-clip overflow-y-visible rounded-[1.5rem] text-slate-950",
            background.boardClassName,
          )}
        >
          <MemoryBoard
            boardId={board.id}
            nextPageHref={
              postPage.nextOffset === null
                ? null
                : `/boards/${board.id}?offset=${postPage.nextOffset}`
            }
            posts={postPage.posts}
            previousPageHref={
              postPage.previousOffset === null
                ? null
                : postPage.previousOffset === 0
                  ? `/boards/${board.id}`
                  : `/boards/${board.id}?offset=${postPage.previousOffset}`
            }
            returnPath={`/boards/${board.id}`}
            themeClassName={background.boardClassName}
            viewerProfileId={profile?.id ?? null}
          />
        </div>
      </div>
    </main>
  );
}

function readOffset(value?: string) {
  const offset = Number(value ?? 0);
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}
