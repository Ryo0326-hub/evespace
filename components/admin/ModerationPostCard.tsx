import { MemoryCard } from "@/components/board/MemoryCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MemoryPost } from "@/types/evespace";

export function ModerationPostCard({
  post,
  action,
}: {
  post: MemoryPost;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="grid gap-4 md:grid-cols-[18rem_1fr]">
      <MemoryCard post={post} />
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
          {post.status}
        </p>
        <h3 className="evespace-card-title mt-2">
          {post.authorDisplayName || "Anonymous"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {post.caption || "No caption provided."}
        </p>
        <form action={action} className="mt-6 flex flex-wrap gap-3">
          <input name="postId" type="hidden" value={post.id} />
          <Button name="intent" type="submit" value="approved">
            Approve
          </Button>
          <Button name="intent" type="submit" value="rejected" variant="secondary">
            Reject
          </Button>
          <Button name="intent" type="submit" value="removed" variant="danger">
            Remove
          </Button>
        </form>
      </div>
    </Card>
  );
}
