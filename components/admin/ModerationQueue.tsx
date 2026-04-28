import { ModerationPostCard } from "@/components/admin/ModerationPostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MemoryPost } from "@/types/evespace";

export function ModerationQueue({
  posts,
  action,
}: {
  posts: MemoryPost[];
  action: (formData: FormData) => Promise<void>;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="No posts are waiting for review."
        description="When attendees leave memories, pending posts will appear here."
      />
    );
  }

  return (
    <div className="grid gap-5">
      {posts.map((post) => (
        <ModerationPostCard key={post.id} post={post} action={action} />
      ))}
    </div>
  );
}
