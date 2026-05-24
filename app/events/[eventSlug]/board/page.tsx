import { notFound } from "next/navigation";
import { Show, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { StickerStoreButton } from "@/components/board/StickerStoreButton";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getBoardTheme } from "@/lib/board-themes";
import { getEventBySlug } from "@/lib/data/events";
import { getApprovedMemoryPostsPageByBoard } from "@/lib/data/memory-posts";
import { cn } from "@/lib/utils";

const postMemoryActionClassName =
  "memory-board-cute-button inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-black transition sm:w-auto";

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

  return (
    <main
      className={`${background.pageClassName} min-h-dvh overflow-x-clip overflow-y-visible px-3 pb-24 pt-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8`}
    >
      <div className="mx-auto min-w-0 max-w-7xl">
        <nav className="grid min-w-0 gap-3 sm:flex sm:items-center sm:justify-between">
          <LinkButton
            className="memory-board-soft-button w-full sm:w-auto"
            href={`/events/${event.slug}`}
            variant="ghost"
          >
            Back to Event
          </LinkButton>
          <div
            className="grid min-w-0 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:justify-end"
            id="memory-board-actions"
          >
            <Show when="signed-in">
              <LinkButton
                className={postMemoryActionClassName}
                href={`/events/${event.slug}/post`}
              >
                Post Memory
              </LinkButton>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className={postMemoryActionClassName} type="button">
                  Post Memory
                </button>
              </SignInButton>
            </Show>
            <StickerStoreButton />
          </div>
        </nav>

        <header className="memory-board-title-card my-7 max-w-3xl rounded-[2rem] p-5 sm:my-10 sm:p-8">
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
    </main>
  );
}

function readOffset(value?: string) {
  const offset = Number(value ?? 0);
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}
