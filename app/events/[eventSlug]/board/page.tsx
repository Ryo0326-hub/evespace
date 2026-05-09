import { notFound } from "next/navigation";
import { Show, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { StickerStoreButton } from "@/components/board/StickerStoreButton";
import { LinkButton } from "@/components/ui/Button";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { boardBackgrounds } from "@/lib/constants";
import { getEventBySlug } from "@/lib/data/events";
import { getApprovedMemoryPosts } from "@/lib/data/memory-posts";
import { cn } from "@/lib/utils";

export default async function MemoryBoardPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    notFound();
  }

  const { userId } = await auth();
  const profile = userId ? await ensureUserProfile() : null;
  const posts = await getApprovedMemoryPosts(event.id);
  const background = boardBackgrounds[event.boardBackgroundTheme];

  return (
    <main
      className={`${background.className} min-h-dvh overflow-visible px-3 pb-24 pt-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8`}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            "-mx-3 px-3 max-sm:sticky max-sm:top-14 max-sm:z-40 max-sm:border-b max-sm:border-black/10 max-sm:py-3 max-sm:backdrop-blur-sm",
            background.className,
            "sm:static sm:z-auto sm:mx-0 sm:border-0 sm:px-0 sm:py-0 sm:backdrop-blur-none",
          )}
        >
          <nav className="grid grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-between">
            <LinkButton
              className="w-full sm:w-auto"
              href={`/events/${event.slug}`}
              variant="ghost"
            >
              Back to Event
            </LinkButton>
            <div className="flex flex-wrap gap-2" id="memory-board-actions">
              <Show when="signed-in">
                <LinkButton className="w-full sm:w-auto" href={`/events/${event.slug}/post`}>
                  Post Memory
                </LinkButton>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-200 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-100 sm:w-auto">
                    Post Memory
                  </button>
                </SignInButton>
              </Show>
              <StickerStoreButton />
            </div>
          </nav>
        </div>

        <header className="my-7 max-w-3xl sm:my-10">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-slate-600">
            Memory Board
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-5xl lg:text-6xl">
            {event.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
            Browse approved photo memories from everyone who entered this event world.
          </p>
        </header>

        <MemoryBoard
          boardId={event.id}
          posts={posts}
          returnPath={`/events/${event.slug}/board`}
          viewerProfileId={profile?.id ?? null}
        />
      </div>
    </main>
  );
}
