import { InteractiveMemoryBoard } from "@/components/board/InteractiveMemoryBoard";
import { LinkButton } from "@/components/ui/Button";
import type { MemoryPost } from "@/types/evespace";

export function MemoryBoard({
  nextPageHref,
  boardId,
  posts,
  previousPageHref,
  returnPath,
  viewerProfileId = null,
}: {
  boardId: string;
  nextPageHref?: string | null;
  posts: MemoryPost[];
  previousPageHref?: string | null;
  returnPath: string;
  viewerProfileId?: string | null;
}) {
  /**
   * Stable across data refresh: do NOT include updatedAt — revalidation after saving
   * stickers would remount this tree, closing the sticker store and resetting client state.
   */
  const interactiveKey = [
    boardId,
    viewerProfileId ?? "",
    posts.map((post) => post.id).join(","),
  ].join("|");

  return (
    <div className="grid gap-6">
      <InteractiveMemoryBoard
        key={interactiveKey}
        boardId={boardId}
        posts={posts}
        returnPath={returnPath}
        viewerProfileId={viewerProfileId}
      />

      {previousPageHref || nextPageHref ? (
        <nav className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {previousPageHref ? (
            <LinkButton
              className="border-cyan-300/70 bg-slate-950 text-cyan-50 shadow-[0_0_18px_rgba(8,145,178,0.18)] hover:border-cyan-100 hover:bg-slate-900 hover:text-white"
              href={previousPageHref}
              variant="secondary"
            >
              Newer Memories
            </LinkButton>
          ) : null}
          {nextPageHref ? (
            <LinkButton
              className="border-cyan-300/70 bg-slate-950 text-cyan-50 shadow-[0_0_18px_rgba(8,145,178,0.18)] hover:border-cyan-100 hover:bg-slate-900 hover:text-white"
              href={nextPageHref}
              variant="secondary"
            >
              Older Memories
            </LinkButton>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
