import { EmptyState } from "@/components/ui/EmptyState";
import { InteractiveMemoryBoard } from "@/components/board/InteractiveMemoryBoard";
import type { MemoryPost } from "@/types/evespace";

export function MemoryBoard({ posts }: { posts: MemoryPost[] }) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="No memories have been posted yet."
        description="Be the first to leave a star in this event's sky."
      />
    );
  }

  return <InteractiveMemoryBoard posts={posts} />;
}
