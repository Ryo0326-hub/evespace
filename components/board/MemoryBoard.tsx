import { EmptyState } from "@/components/ui/EmptyState";
import { InteractiveMemoryBoard } from "@/components/board/InteractiveMemoryBoard";
import type { MemoryPost } from "@/types/evespace";

export function MemoryBoard({
  boardId,
  posts,
  viewerProfileId = null,
}: {
  boardId: string;
  posts: MemoryPost[];
  viewerProfileId?: string | null;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="No memories have been posted yet."
        description="Be the first to leave a star in this event's sky."
      />
    );
  }

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
    <InteractiveMemoryBoard
      key={interactiveKey}
      boardId={boardId}
      posts={posts}
      viewerProfileId={viewerProfileId}
    />
  );
}
