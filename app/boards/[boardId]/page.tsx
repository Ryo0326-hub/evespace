import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FollowButton } from "@/components/social/FollowButton";
import {
  MemoryBoardActionBar,
  type MemoryBoardAction,
} from "@/components/board/MemoryBoardActionBar";
import { MemoryBoard } from "@/components/board/MemoryBoard";
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
import { canUsePremiumStickers } from "@/lib/premium/premium-utils.mjs";
import { compactDateLocation } from "@/lib/utils";

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
  const actionBarActions: MemoryBoardAction[] = [];

  if (canPost) {
    actionBarActions.push({
      ariaLabel: "Post a memory",
      href: `/boards/${board.id}/post`,
      icon: "create",
      label: "Post",
      type: "link",
    });
  } else if (!profile) {
    actionBarActions.push({
      ariaLabel: "Sign in to post a memory",
      href: "/login",
      icon: "create",
      label: "Post",
      type: "link",
    });
  }

  if (canManage) {
    actionBarActions.push({
      ariaLabel: "Edit board",
      href: `/boards/${board.id}/edit`,
      icon: "edit",
      label: "Edit",
      type: "link",
    });
  }

  actionBarActions.push(
    {
      ariaLabel: "Open sticker store",
      icon: "sticker",
      label: "Stickers",
      type: "sticker-store",
    },
    {
      ariaLabel: "Back to dashboard",
      href: "/dashboard",
      icon: "back",
      label: "Back",
      type: "link",
    },
  );

  return (
    <main className={`${background.pageClassName} memory-board-main min-h-dvh overflow-x-clip overflow-y-visible px-3 pb-36 pt-0 text-slate-950 sm:px-6 md:pb-6 md:pt-3 lg:px-8`}>
      <div className="mx-auto min-w-0 max-w-7xl">
        <div className="memory-board-page-shell min-w-0 md:grid md:grid-cols-[6.25rem_minmax(0,1fr)] md:items-start md:gap-4">
          <MemoryBoardActionBar actions={actionBarActions} />

          <div className="memory-board-content-stack min-w-0">
            <header className="memory-board-title-card mt-0 mb-0 grid gap-3 rounded-[2rem] p-5 md:mt-3 md:mb-3 sm:p-8">
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

            <div className="overflow-x-clip overflow-y-visible rounded-[1.5rem] text-slate-950">
              <MemoryBoard
                boardId={board.id}
                canUsePremiumStickers={canUsePremiumStickers(profile)}
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
        </div>
      </div>
    </main>
  );
}

function readOffset(value?: string) {
  const offset = Number(value ?? 0);
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}
