import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FollowButton } from "@/components/social/FollowButton";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { StickerStoreButton } from "@/components/board/StickerStoreButton";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { boardBackgrounds } from "@/lib/constants";
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
  "w-full border-cyan-300/70 !bg-slate-950 !text-cyan-50 shadow-[0_0_24px_rgba(8,145,178,0.28)] hover:border-cyan-100 hover:!bg-slate-900 hover:!text-white sm:w-auto";

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

  const background = boardBackgrounds[board.boardBackgroundTheme];

  return (
    <main className={`${background.className} min-h-dvh overflow-visible px-3 pb-24 pt-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8`}>
      <div className="mx-auto max-w-7xl">
        <nav className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between">
          <LinkButton className="w-full sm:w-auto" href="/dashboard" variant="secondary">
            Back to Dashboard
          </LinkButton>
          <div className="flex flex-wrap gap-2">
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
                className="w-full sm:w-auto"
                href={`/boards/${board.id}/edit`}
                variant="secondary"
              >
                Edit Board
              </LinkButton>
            ) : null}
          </div>
        </nav>

        <header className="my-7 grid gap-4 rounded-[2rem] border-2 border-black bg-white p-5 shadow-sm sm:my-10 sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
              {sharingScopeLabel(board.sharingScope)}
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
                followingProfileId={board.ownerProfileId}
                returnPath={`/boards/${board.id}`}
                status={followStatus}
              />
            </div>
          ) : null}
        </header>

        <div
          className={cn(
            "-mx-3 px-3 sticky top-14 z-[56] mb-4 mt-6 shrink-0 border-b border-black/15 py-3 shadow-sm backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
            background.className,
          )}
          id="memory-board-actions"
        >
          <div className="flex justify-end">
            <StickerStoreButton />
          </div>
        </div>

        <Card className="overflow-visible border-black/10 bg-white/60 text-slate-950 shadow-sm">
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
            viewerProfileId={profile?.id ?? null}
          />
        </Card>
      </div>
    </main>
  );
}

function readOffset(value?: string) {
  const offset = Number(value ?? 0);
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}
