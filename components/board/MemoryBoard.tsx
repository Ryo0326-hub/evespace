import { InteractiveMemoryBoard } from "@/components/board/InteractiveMemoryBoard";
import { LinkButton } from "@/components/ui/Button";
import type { MemoryPost } from "@/types/evespace";

export function MemoryBoard({
  nextPageHref,
  boardId,
  posts,
  previousPageHref,
  returnPath,
  themeClassName,
  viewerProfileId = null,
}: {
  boardId: string;
  nextPageHref?: string | null;
  posts: MemoryPost[];
  previousPageHref?: string | null;
  returnPath: string;
  themeClassName?: string;
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
    <div className="grid min-w-0 max-w-full gap-6 overflow-x-clip">
      <InteractiveMemoryBoard
        key={interactiveKey}
        boardId={boardId}
        posts={posts}
        returnPath={returnPath}
        themeClassName={themeClassName}
        viewerProfileId={viewerProfileId}
      />

      {previousPageHref || nextPageHref ? (
        <nav className="flex min-w-0 flex-col gap-3 sm:flex-row sm:justify-center">
          {previousPageHref ? (
            <LinkButton
              className="memory-board-cute-button font-black"
              href={previousPageHref}
              variant="secondary"
            >
              Newer Memories
            </LinkButton>
          ) : null}
          {nextPageHref ? (
            <LinkButton
              className="memory-board-cute-button font-black"
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
