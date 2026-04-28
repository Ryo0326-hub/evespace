import { notFound } from "next/navigation";
import { Show, SignInButton } from "@clerk/nextjs";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { StickerStoreButton } from "@/components/board/StickerStoreButton";
import { LinkButton } from "@/components/ui/Button";
import { boardBackgrounds } from "@/lib/constants";
import { getEventBySlug } from "@/lib/data/events";
import { getApprovedMemoryPosts } from "@/lib/data/memory-posts";

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

  const posts = await getApprovedMemoryPosts(event.id);

  return (
    <main
      className={`${boardBackgrounds[event.boardBackgroundTheme].className} min-h-dvh overflow-visible px-3 pb-24 pt-4 text-slate-950 sm:px-6 sm:py-6 lg:px-8`}
    >
      <div className="mx-auto max-w-7xl">
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

        <MemoryBoard posts={posts} />
      </div>
    </main>
  );
}
