import { mapMemoryPost, mapMemoryPostComment } from "@/lib/data/mappers";
import { mockMemoryPosts } from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MemoryPost, MemoryPostStatus } from "@/types/evespace";

export async function getApprovedMemoryPosts(eventId: string): Promise<MemoryPost[]> {
  return getApprovedMemoryPostsByBoard(eventId);
}

export async function getApprovedMemoryPostsByBoard(
  boardId: string,
): Promise<MemoryPost[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return mockMemoryPosts.filter(
      (post) =>
        (post.boardId === boardId || post.eventId === boardId) &&
        post.status === "approved",
    );
  }

  const { data, error } = await supabase
    .from("memory_posts")
    .select("*")
    .eq("board_id", boardId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load approved memory posts", error);
    return [];
  }

  const posts = data.map(mapMemoryPost);
  return attachComments(posts);
}

export async function getPendingMemoryPosts(eventId: string): Promise<MemoryPost[]> {
  return getModerationMemoryPostsByBoard(eventId);
}

export async function getModerationMemoryPostsByBoard(
  boardId: string,
): Promise<MemoryPost[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return mockMemoryPosts.filter(
      (post) => post.boardId === boardId || post.eventId === boardId,
    );
  }

  const { data, error } = await supabase
    .from("memory_posts")
    .select("*")
    .eq("board_id", boardId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load moderation posts", error);
    return [];
  }

  const posts = data.map(mapMemoryPost);
  return attachComments(posts);
}

export async function getMemoryPostsByClerkUser(
  clerkUserId: string,
): Promise<MemoryPost[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("memory_posts")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load user memory posts", error);
    return [];
  }

  const posts = data.map(mapMemoryPost);
  return attachComments(posts);
}

export async function updateMemoryPostStatus(
  postId: string,
  status: MemoryPostStatus,
) {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("memory_posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", postId);

  return { error: error?.message ?? null };
}

async function attachComments(posts: MemoryPost[]): Promise<MemoryPost[]> {
  if (posts.length === 0) {
    return posts;
  }

  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return posts;
  }

  const postIds = posts.map((post) => post.id);
  const { data, error } = await supabase
    .from("memory_post_comments")
    .select("*")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (error) {
    if (!isMissingCommentsTableError(error)) {
      console.error("Failed to load memory post comments", error.message ?? error);
    }
    return posts;
  }

  const commentsByPost = data.reduce<Record<string, ReturnType<typeof mapMemoryPostComment>[]>>(
    (groups, row) => {
      const comment = mapMemoryPostComment(row);
      groups[comment.postId] = [...(groups[comment.postId] ?? []), comment];
      return groups;
    },
    {},
  );

  return posts.map((post) => ({
    ...post,
    comments: commentsByPost[post.id] ?? [],
  }));
}

function isMissingCommentsTableError(error: { code?: string; message?: string }) {
  const message = String(error.message ?? "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("memory_post_comments") &&
      (message.includes("does not exist") || message.includes("could not find")))
  );
}
