import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  MemoryBoardActionBar,
  type MemoryBoardAction,
} from "@/components/board/MemoryBoardActionBar";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
import { getEventBySlug } from "@/lib/data/events";
import { getApprovedMemoryPostsPageByBoard } from "@/lib/data/memory-posts";
import { canUsePremiumStickers } from "@/lib/premium/premium-utils.mjs";

export default async function MemoryBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams?: Promise<{ offset?: string }>;
}) {
  const { eventSlug } = await params;
  const offset = readOffset((await searchParams)?.offset);
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  const { userId } = await auth();
  const profile = userId ? await ensureUserProfile() : null;
  const postPage = await getApprovedMemoryPostsPageByBoard(event.id, { offset });
  const background = getBoardTheme(event.boardBackgroundTheme);
  const actionBarActions: MemoryBoardAction[] = [
    profile
      ? {
          ariaLabel: "Post a memory",
          href: `/events/${event.slug}/post`,
          icon: "create",
          label: "Post",
          type: "link",
        }
      : {
          ariaLabel: "Sign in to post a memory",
          icon: "create",
          label: "Post",
          type: "sign-in",
        },
    {
      ariaLabel: "Open sticker store",
      icon: "sticker",
      label: "Stickers",
      type: "sticker-store",
    },
    {
      ariaLabel: "Back to event",
      href: `/events/${event.slug}`,
      icon: "back",
      label: "Back",
      type: "link",
    },
  ];

  return (
    <main
      className={`${background.pageClassName} memory-board-main h-[calc(100dvh-4rem)] overflow-x-clip overflow-y-auto px-3 pb-36 pt-0 text-slate-950 sm:px-6 md:pt-3 lg:px-8`}
    >
      <div className="min-w-0 w-full">
        <div className="memory-board-page-shell min-w-0 w-full">
          <MemoryBoardActionBar actions={actionBarActions} />

          <div className="memory-board-content-stack min-w-0">
            <header className="memory-board-title-card mt-0 mb-0 max-w-3xl rounded-[2rem] p-5 md:mt-3 md:mb-3 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-600">
                Memory Board
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-normal text-black sm:text-5xl lg:text-6xl">
                <span className="memory-board-title-mark">{event.title}</span>
              </h1>
              <p className="mt-5 text-sm font-medium leading-7 text-slate-700 sm:text-base">
                Browse approved photo memories from everyone who entered this event world.
              </p>
            </header>

            <div className="overflow-x-clip overflow-y-visible rounded-[1.5rem] text-slate-950">
              <MemoryBoard
                boardId={event.id}
                canUsePremiumStickers={canUsePremiumStickers(profile)}
                nextPageHref={
                  postPage.nextOffset === null
                    ? null
                    : `/events/${event.slug}/board?offset=${postPage.nextOffset}`
                }
                posts={postPage.posts}
                previousPageHref={
                  postPage.previousOffset === null
                    ? null
                    : postPage.previousOffset === 0
                      ? `/events/${event.slug}/board`
                      : `/events/${event.slug}/board?offset=${postPage.previousOffset}`
                }
                returnPath={`/events/${event.slug}/board`}
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
