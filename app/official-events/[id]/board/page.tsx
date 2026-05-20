import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { StickerStoreButton } from "@/components/board/StickerStoreButton";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
import {
  canPostToBoard,
  getAccessibleBoardById,
} from "@/lib/data/boards";
import { getApprovedMemoryPostsPageByBoard } from "@/lib/data/memory-posts";
import { cn } from "@/lib/utils";

const postMemoryActionClassName =
  "memory-board-cute-button inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-black transition sm:w-auto";

export default async function OfficialEventMemoryBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ offset?: string }>;
}) {
  const { id } = await params;
  const offset = readOffset((await searchParams)?.offset);
  const { userId } = await auth();
  const profile = userId ? await ensureUserProfile() : null;
  const event = await getAccessibleBoardById(id, profile);

  if (!event || event.boardType !== "official_event") {
    notFound();
  }

  const [postPage, canPost] = await Promise.all([
    getApprovedMemoryPostsPageByBoard(event.id, { offset }),
    canPostToBoard(event, profile),
  ]);
  const background = getBoardTheme(event.boardBackgroundTheme);

  return (
    <main
      className={`${background.pageClassName} min-h-dvh overflow-x-clip overflow-y-visible px-3 pb-24 pt-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8`}
    >
      <div className="mx-auto min-w-0 max-w-7xl">
        <div
          className={cn(
            "-mx-3 px-3 max-sm:sticky max-sm:top-14 max-sm:z-40 max-sm:border-b max-sm:border-black/10 max-sm:py-3 max-sm:backdrop-blur-sm",
            background.navClassName,
            "sm:static sm:z-auto sm:mx-0 sm:border-0 sm:px-0 sm:py-0 sm:backdrop-blur-none",
          )}
        >
          <nav className="grid min-w-0 grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between">
            <LinkButton
              className="memory-board-soft-button w-full sm:w-auto"
              href={`/official-events/${event.id}`}
              variant="ghost"
            >
              Back to Event
            </LinkButton>
            <div className="flex min-w-0 flex-wrap gap-2" id="memory-board-actions">
              {canPost ? (
                <LinkButton
                  className={postMemoryActionClassName}
                  href={`/official-events/${event.id}/post`}
                >
                  Post Memory
                </LinkButton>
              ) : !profile ? (
                <LinkButton className={postMemoryActionClassName} href="/login">
                  Sign in to Post
                </LinkButton>
              ) : null}
              <StickerStoreButton />
            </div>
          </nav>
        </div>

        <header className="memory-board-title-card my-7 max-w-3xl rounded-[2rem] p-5 sm:my-10 sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-600">
            Official Event Memory Board
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-normal text-black sm:text-5xl lg:text-6xl">
            <span className="memory-board-title-mark">{event.title}</span>
          </h1>
          <p className="mt-5 text-sm font-medium leading-7 text-slate-700 sm:text-base">
            Browse approved memories from this official event. Official event
            posts can include up to 3 stickers.
          </p>
        </header>

        <div
          className={cn(
            "overflow-x-clip overflow-y-visible rounded-[1.5rem] text-slate-950",
            background.boardClassName,
          )}
        >
          <MemoryBoard
            boardId={event.id}
            nextPageHref={
              postPage.nextOffset === null
                ? null
                : `/official-events/${event.id}/board?offset=${postPage.nextOffset}`
            }
            posts={postPage.posts}
            previousPageHref={
              postPage.previousOffset === null
                ? null
                : postPage.previousOffset === 0
                  ? `/official-events/${event.id}/board`
                  : `/official-events/${event.id}/board?offset=${postPage.previousOffset}`
            }
            returnPath={`/official-events/${event.id}/board`}
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
