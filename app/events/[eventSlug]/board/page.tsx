import { notFound } from "next/navigation";
import { Show, SignInButton } from "@clerk/nextjs";
import { MemoryBoard } from "@/components/board/MemoryBoard";
import { LinkButton } from "@/components/ui/Button";
import { getEventBySlug } from "@/lib/data/events";
import { getApprovedMemoryPosts } from "@/lib/data/memory-posts";

const themeClass = {
  space: "cosmic-bg",
  milky_way: "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950",
  festival_night: "bg-gradient-to-br from-slate-950 via-fuchsia-950 to-cyan-950",
  scrapbook: "bg-gradient-to-br from-amber-950 via-slate-950 to-rose-950",
  pastel_sky: "bg-gradient-to-br from-slate-950 via-purple-950 to-cyan-950",
  dark_minimal: "bg-slate-950",
};

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
      className={`${themeClass[event.boardBackgroundTheme]} min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8`}
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
        </nav>

        <header className="my-7 max-w-3xl sm:my-10">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Memory Board
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {event.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Browse approved photos, sticky notes, and decorated memories from
            everyone who entered this event world.
          </p>
        </header>

        <MemoryBoard posts={posts} />
      </div>
    </main>
  );
}
