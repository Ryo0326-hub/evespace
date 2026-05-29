import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  MemoryBoardActionBar,
  type MemoryBoardAction,
} from "@/components/board/MemoryBoardActionBar";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
import {
  canPostToBoard,
  getAccessibleBoardById,
} from "@/lib/data/boards";
import { getApprovedMemoryPostsPageByBoard } from "@/lib/data/memory-posts";
import { canUsePremiumStickers } from "@/lib/premium/premium-utils.mjs";

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
  const actionBarActions: MemoryBoardAction[] = [];

  if (canPost) {
    actionBarActions.push({
      ariaLabel: "Post a memory",
      href: `/official-events/${event.id}/post`,
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

  actionBarActions.push(
    {
      ariaLabel: "Open sticker store",
      icon: "sticker",
      label: "Stickers",
      type: "sticker-store",
    },
    {
      ariaLabel: "Back to event",
      href: `/official-events/${event.id}`,
      icon: "back",
      label: "Back",
      type: "link",
    },
  );

  return (
    <main
      className={`${background.pageClassName} memory-board-main min-h-dvh overflow-x-clip overflow-y-visible px-3 pb-36 pt-0 text-slate-950 sm:px-6 md:pb-6 md:pt-3 lg:px-8`}
    >
      <div className="mx-auto min-w-0 max-w-7xl">
        <div className="memory-board-page-shell min-w-0 md:grid md:grid-cols-[6.25rem_minmax(0,1fr)] md:items-start md:gap-4">
          <MemoryBoardActionBar actions={actionBarActions} />

          <div className="memory-board-content-stack min-w-0">
            <header className="memory-board-title-card mt-0 mb-0 max-w-3xl rounded-[2rem] p-5 md:mt-3 md:mb-3 sm:p-8">
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

            <div className="overflow-x-clip overflow-y-visible rounded-[1.5rem] text-slate-950">
              <MemoryBoard
                boardId={event.id}
                canUsePremiumStickers={canUsePremiumStickers(profile)}
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
        </div>
      </div>
    </main>
  );
}

function readOffset(value?: string) {
  const offset = Number(value ?? 0);
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}
