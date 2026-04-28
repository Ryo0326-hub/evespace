import { mapMemoryPost } from "@/lib/data/mappers";
import { mockMemoryPosts } from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MemoryPost, MemoryPostStatus } from "@/types/evespace";

export async function getApprovedMemoryPosts(eventId: string): Promise<MemoryPost[]> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return mockMemoryPosts.filter(
      (post) => post.eventId === eventId && post.status === "approved",
    );
  }

  const { data, error } = await supabase
    .from("memory_posts")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load approved memory posts", error);
    return [];
  }

  return data.map(mapMemoryPost);
}

export async function getPendingMemoryPosts(eventId: string): Promise<MemoryPost[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return mockMemoryPosts.filter((post) => post.eventId === eventId);
  }

  const { data, error } = await supabase
    .from("memory_posts")
    .select("*")
    .eq("event_id", eventId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load moderation posts", error);
    return [];
  }

  return data.map(mapMemoryPost);
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

  return data.map(mapMemoryPost);
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
