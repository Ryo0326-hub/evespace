import {
  mapMemoryPost,
  mapMemoryPostComment,
  mapMemoryPostMedia,
} from "@/lib/data/mappers";
import { mockMemoryPosts } from "@/lib/mock-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { memoryPostPageSize } from "@/lib/constants";
import type {
  MemoryPost,
  MemoryPostStatus,
  PlacedSticker,
  StickerPlacement,
  StickerSelection,
} from "@/types/evespace";

export type MemoryPostPageOptions = {
  limit?: number;
  offset?: number;
};

export type MemoryPostPage = {
  posts: MemoryPost[];
  hasMore: boolean;
  nextOffset: number | null;
  previousOffset: number | null;
};

export async function getApprovedMemoryPosts(
  eventId: string,
  options: MemoryPostPageOptions = {},
): Promise<MemoryPost[]> {
  return getApprovedMemoryPostsByBoard(eventId, options);
}

export async function getApprovedMemoryPostsByBoard(
  boardId: string,
  options: MemoryPostPageOptions = {},
): Promise<MemoryPost[]> {
  const page = await getApprovedMemoryPostsPageByBoard(boardId, options);
  return page.posts;
}

export async function getApprovedMemoryPostsPageByBoard(
  boardId: string,
  options: MemoryPostPageOptions = {},
): Promise<MemoryPostPage> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();
  const limit = normalizeLimit(options.limit);
  const offset = normalizeOffset(options.offset);

  if (!supabase) {
    const filteredPosts = mockMemoryPosts.filter(
      (post) =>
        (post.boardId === boardId || post.eventId === boardId) &&
        post.status === "approved",
    );
    const posts = filteredPosts.slice(offset, offset + limit);

    return {
      posts,
      hasMore: filteredPosts.length > offset + limit,
      nextOffset: filteredPosts.length > offset + limit ? offset + limit : null,
      previousOffset: offset > 0 ? Math.max(0, offset - limit) : null,
    };
  }

  const { data, error } = await supabase
    .from("memory_posts")
    .select("*")
    .eq("board_id", boardId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    console.error("Failed to load approved memory posts", error);
    return emptyMemoryPostPage(offset, limit);
  }

  const hasMore = data.length > limit;
  const posts = await hydrateMemoryPosts(data.slice(0, limit).map(mapMemoryPost));

  return {
    posts,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
    previousOffset: offset > 0 ? Math.max(0, offset - limit) : null,
  };
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

  return hydrateMemoryPosts(data.map(mapMemoryPost));
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

  return hydrateMemoryPosts(data.map(mapMemoryPost));
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

async function hydrateMemoryPosts(posts: MemoryPost[]): Promise<MemoryPost[]> {
  const withMedia = await attachMedia(posts);
  const withStickers = await attachNormalizedStickers(withMedia);
  return attachComments(withStickers);
}

async function attachMedia(posts: MemoryPost[]): Promise<MemoryPost[]> {
  if (posts.length === 0) {
    return posts;
  }

  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return posts;
  }

  const postIds = posts.map((post) => post.id);
  const { data, error } = await supabase
    .from("memory_post_media")
    .select("*")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (!isMissingNormalizedMemoryTableError(error)) {
      console.error("Failed to load memory post media", error.message ?? error);
    }
    return posts;
  }

  const mediaByPost = data.reduce<Record<string, ReturnType<typeof mapMemoryPostMedia>[]>>(
    (groups, row) => {
      const media = mapMemoryPostMedia(row);
      groups[media.postId] = [...(groups[media.postId] ?? []), media];
      return groups;
    },
    {},
  );

  return posts.map((post) => {
    const media = mediaByPost[post.id]?.[0];

    if (!media) {
      return post;
    }

    const imageUrl =
      media.storageBucket === "legacy-external"
        ? media.storagePath
        : supabase.storage.from(media.storageBucket).getPublicUrl(media.storagePath)
            .data.publicUrl;

    return {
      ...post,
      imageUrl: imageUrl || post.imageUrl,
      storagePath: media.storagePath || post.storagePath,
    };
  });
}

async function attachNormalizedStickers(posts: MemoryPost[]): Promise<MemoryPost[]> {
  if (posts.length === 0) {
    return posts;
  }

  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return posts;
  }

  const postIds = posts.map((post) => post.id);
  const { data, error } = await supabase
    .from("memory_post_stickers")
    .select("*")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (!isMissingNormalizedMemoryTableError(error)) {
      console.error("Failed to load memory post stickers", error.message ?? error);
    }
    return posts;
  }

  const grouped = data.reduce<
    Record<string, { corner: StickerSelection[]; overlay: PlacedSticker[] }>
  >((groups, row) => {
    const postId = String(row.post_id);
    const group = groups[postId] ?? { corner: [], overlay: [] };
    const stickerId = String(row.sticker_id ?? "");

    if (row.sticker_kind === "corner") {
      const placement = readStickerPlacement(row.placement);

      if (stickerId && placement) {
        group.corner.push({ stickerId, placement });
      }
    } else {
      const x = Number(row.x);
      const y = Number(row.y);

      if (stickerId && Number.isFinite(x) && Number.isFinite(y)) {
        group.overlay.push({
          id: String(row.client_sticker_id ?? row.id),
          postId,
          stickerId,
          x: clampUnitInterval(x),
          y: clampUnitInterval(y),
          rotation: Number(row.rotation ?? 0),
          size: Number(row.size ?? 68),
        });
      }
    }

    groups[postId] = group;
    return groups;
  }, {});

  return posts.map((post) => {
    const group = grouped[post.id];

    if (!group) {
      return post;
    }

    return {
      ...post,
      stickers: group.corner,
      overlayStickers: group.overlay,
    };
  });
}

function normalizeLimit(limit?: number) {
  if (!Number.isFinite(limit)) {
    return memoryPostPageSize;
  }

  return Math.min(Math.max(Math.floor(limit ?? memoryPostPageSize), 1), 60);
}

function normalizeOffset(offset?: number) {
  if (!Number.isFinite(offset)) {
    return 0;
  }

  return Math.max(Math.floor(offset ?? 0), 0);
}

function emptyMemoryPostPage(offset: number, limit: number): MemoryPostPage {
  return {
    posts: [],
    hasMore: false,
    nextOffset: null,
    previousOffset: offset > 0 ? Math.max(0, offset - limit) : null,
  };
}

function readStickerPlacement(value: unknown): StickerPlacement | null {
  if (
    value === "top_left" ||
    value === "top_right" ||
    value === "bottom_left" ||
    value === "bottom_right"
  ) {
    return value;
  }

  return null;
}

function clampUnitInterval(value: number) {
  return Math.min(1, Math.max(0, value));
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

function isMissingNormalizedMemoryTableError(error: { code?: string; message?: string }) {
  const message = String(error.message ?? "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("memory_post_media") &&
      (message.includes("does not exist") || message.includes("could not find"))) ||
    (message.includes("memory_post_stickers") &&
      (message.includes("does not exist") || message.includes("could not find")))
  );
}
