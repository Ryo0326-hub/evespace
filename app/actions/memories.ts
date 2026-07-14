"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { requireBoardAdmin } from "@/lib/auth/permissions";
import {
  canPostToBoard,
  getAccessibleBoardById,
  getBoardById,
} from "@/lib/data/boards";
import { getEventBySlug } from "@/lib/data/events";
import {
  createMemoryCommentNotifications,
  createMemoryPostAddedNotifications,
  createMemoryPostModeratedNotification,
} from "@/lib/data/notifications";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  acceptedImageTypes,
  legacyMemoryPhotoBucket,
  maxUploadSizeBytes,
  memoryPostMediaBucket,
} from "@/lib/constants";
import {
  assertPremiumStickerAccess,
  canUsePremiumStickers,
} from "@/lib/premium/premium-utils.mjs";
import { normalizeMemoryPostStyleSelection } from "@/lib/memory-post-style.mjs";
import { isRegisteredStickerId } from "@/lib/stickers/sticker-registry";
import type {
  Board,
  MemoryPostStatus,
  PlacedSticker,
  Profile,
  StickerPlacement,
  StickerSelection,
} from "@/types/evespace";

export async function createMemoryPostAction(
  eventSlug: string,
  formData: FormData,
) {
  const event = await getEventBySlug(eventSlug);
  if (!event) {
    throw new Error("Official event was not found.");
  }

  await createBoardMemoryPost(event.id, formData, `/events/${event.slug}/board`);
}

export async function createPrivateBoardMemoryPostAction(
  boardId: string,
  formData: FormData,
) {
  await createBoardMemoryPost(boardId, formData, `/boards/${boardId}`);
}

export async function createOfficialEventMemoryPostAction(
  boardId: string,
  formData: FormData,
) {
  await createBoardMemoryPost(boardId, formData, `/official-events/${boardId}/board`);
}

async function createBoardMemoryPost(
  boardId: string,
  formData: FormData,
  returnPath: string,
) {
  const profile = await ensureUserProfile();
  if (!profile) {
    redirect("/login");
  }

  const board = await getAccessibleBoardById(boardId, profile);
  const photo = formData.get("photo");
  const photoFile = photo instanceof File && photo.size > 0 ? photo : null;
  const message = clean(formData.get("message")) ?? clean(formData.get("caption"));
  const memoryPostStyle = normalizeMemoryPostStyleSelection({
    stickyNoteStyle: formData.get("stickyNoteStyle"),
    memoryPenStyle: formData.get("memoryPenStyle"),
  });
  const supabase = getSupabaseAdminClient();

  if (!board || !supabase || !(await canPostToBoard(board, profile))) {
    throw new Error("Memory posting is not configured.");
  }

  if (!message && !photoFile) {
    throw new Error("Add a message or photo before posting.");
  }

  if (message && message.length > 1200) {
    throw new Error("Messages must be 1200 characters or fewer.");
  }

  if (photoFile && !acceptedImageTypes.includes(photoFile.type)) {
    throw new Error("Use a JPG, PNG, or WebP image.");
  }

  if (photoFile && photoFile.size > maxUploadSizeBytes) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const stickers = readStickers(formData, {
    rejectOverLimit: board.boardType === "official_event",
  });
  assertPremiumStickerAccess({
    profile,
    stickerCount: stickers.length,
  });

  const status = "approved";
  let uploadedMedia: UploadedMemoryMedia | null = null;
  let insertResult = await insertMemoryPostRecord({
    board,
    legacyImageUrl: null,
    legacyStickers: [],
    legacyStoragePath: null,
    memoryPostStyle,
    message,
    profile,
    status,
  });
  let post = insertResult.post;

  if (!post && isLegacyImageUrlRequiredError(insertResult.error)) {
    if (!photoFile) {
      throw new Error(
        "Message-only memories need the latest Supabase memory post migration.",
      );
    }

    uploadedMedia = await uploadMemoryMedia({
      boardId: board.id,
      file: photoFile,
      pathOwner: profile.clerkUserId,
      supabase,
    });
    insertResult = await insertMemoryPostRecord({
      board,
      legacyImageUrl: uploadedMedia.publicUrl,
      legacyStickers: stickers,
      legacyStoragePath: uploadedMedia.storagePath,
      memoryPostStyle,
      message,
      profile,
      status,
    });
    post = insertResult.post;
  }

  if (!post) {
    throw new Error(insertResult.error?.message ?? "Memory post could not be saved.");
  }

  try {
    let mediaSaved = true;

    if (photoFile && !uploadedMedia) {
      uploadedMedia = await uploadMemoryMedia({
        boardId: board.id,
        file: photoFile,
        pathOwner: String(post.id),
        supabase,
      });
    }

    if (photoFile && uploadedMedia) {
      mediaSaved = await insertMemoryPostMedia({
        boardId: board.id,
        file: photoFile,
        media: uploadedMedia,
        postId: String(post.id),
        supabase,
      });
    }

    const stickersSaved = await insertCornerStickerRows({
      boardId: board.id,
      postId: String(post.id),
      stickers,
      supabase,
    });

    if (photoFile && uploadedMedia && (!mediaSaved || !stickersSaved)) {
      await updateLegacyMemoryPostAssets({
        imageUrl: uploadedMedia.publicUrl,
        postId: String(post.id),
        stickers,
        storagePath: uploadedMedia.storagePath,
        supabase,
      });
    } else if (!stickersSaved) {
      await updateLegacyMemoryPostStickers({
        postId: String(post.id),
        stickers,
        supabase,
      });
    }
  } catch (error) {
    await supabase.from("memory_posts").delete().eq("id", post.id);

    if (uploadedMedia) {
      await supabase.storage
        .from(uploadedMedia.storageBucket)
        .remove([uploadedMedia.storagePath]);
    }

    throw error;
  }

  await createMemoryPostAddedNotifications({
    actor: profile,
    board,
    postId: String(post.id),
  });

  revalidatePath(returnPath);
  revalidatePath("/notifications");
  if (board.boardType === "official_event") {
    revalidatePath(`/events/${board.slug}`);
    revalidatePath(`/official-events/${board.id}`);
    revalidatePath(`/official-events/${board.id}/board`);
  }
  redirect(`${returnPath}?posted=approved`);
}

type SupabaseAdminClient = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

type MemoryPostInsertError = {
  code?: string;
  message?: string;
} | null;

type UploadedMemoryMedia = {
  publicUrl: string;
  storageBucket: string;
  storagePath: string;
};

async function insertMemoryPostRecord({
  board,
  legacyImageUrl,
  legacyStickers,
  legacyStoragePath,
  memoryPostStyle,
  message,
  profile,
  status,
}: {
  board: Board;
  legacyImageUrl: string | null;
  legacyStickers: StickerSelection[];
  legacyStoragePath: string | null;
  memoryPostStyle: {
    stickyNoteStyle: string;
    memoryPenStyle: string;
  };
  message: string | null;
  profile: Profile;
  status: MemoryPostStatus;
}): Promise<{
  post: { id: string } | null;
  error: MemoryPostInsertError;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      post: null,
      error: { message: "Supabase service role is not configured." },
    };
  }

  const payload = {
    board_id: board.id,
    event_id: board.boardType === "official_event" ? board.id : null,
    author_id: profile.id,
    profile_id: profile.id,
    clerk_user_id: profile.clerkUserId,
    author_display_name:
      profile.displayName ||
      profile.email ||
      "Anonymous",
    image_url: legacyImageUrl,
    storage_path: legacyStoragePath,
    caption: message,
    stickers: legacyStickers,
    status,
    frame_style: "none",
    sticky_note_style: memoryPostStyle.stickyNoteStyle,
    message_pen_style: memoryPostStyle.memoryPenStyle,
    rotation: createMemoryPostRotation(),
  };

  const { data, error } = await supabase
    .from("memory_posts")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    if (isMissingAuthorIdColumnError(error)) {
      const legacyPayload: Partial<typeof payload> = { ...payload };
      delete legacyPayload.author_id;
      const { data: legacyData, error: legacyError } = await supabase
        .from("memory_posts")
        .insert(legacyPayload)
        .select("id")
        .single();

      if (legacyError) {
        return { post: null, error: legacyError };
      }

      return { post: { id: String(legacyData.id) }, error: null };
    }

    return { post: null, error };
  }

  return { post: { id: String(data.id) }, error: null };
}

async function uploadMemoryMedia({
  boardId,
  file,
  pathOwner,
  supabase,
}: {
  boardId: string;
  file: File;
  pathOwner: string;
  supabase: SupabaseAdminClient;
}): Promise<UploadedMemoryMedia> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${boardId}/${pathOwner}/${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const buckets = [memoryPostMediaBucket, legacyMemoryPhotoBucket];
  let lastError: Error | null = null;

  for (const bucket of buckets) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(storagePath);

      return {
        publicUrl,
        storageBucket: bucket,
        storagePath,
      };
    }

    lastError = new Error(error.message);

    if (!isMissingStorageBucketError(error) || bucket === legacyMemoryPhotoBucket) {
      break;
    }
  }

  throw lastError ?? new Error("Media upload failed.");
}

async function insertMemoryPostMedia({
  boardId,
  file,
  media,
  postId,
  supabase,
}: {
  boardId: string;
  file: File;
  media: UploadedMemoryMedia;
  postId: string;
  supabase: SupabaseAdminClient;
}) {
  const { error } = await supabase.from("memory_post_media").insert({
    post_id: postId,
    board_id: boardId,
    storage_bucket: media.storageBucket,
    storage_path: media.storagePath,
    media_type: "image",
    mime_type: file.type,
    byte_size: file.size,
    original_file_name: file.name,
    sort_order: 0,
  });

  if (!error) {
    return true;
  }

  if (isMissingNormalizedMemoryTableError(error)) {
    return false;
  }

  throw new Error(error.message);
}

async function insertCornerStickerRows({
  boardId,
  postId,
  stickers,
  supabase,
}: {
  boardId: string;
  postId: string;
  stickers: StickerSelection[];
  supabase: SupabaseAdminClient;
}) {
  if (stickers.length === 0) {
    return true;
  }

  const { error } = await supabase.from("memory_post_stickers").insert(
    stickers.map((sticker, index) => ({
      post_id: postId,
      board_id: boardId,
      sticker_id: sticker.stickerId,
      sticker_kind: "corner",
      placement: sticker.placement,
      sort_order: index,
    })),
  );

  if (!error) {
    return true;
  }

  if (isMissingNormalizedMemoryTableError(error)) {
    return false;
  }

  throw new Error(error.message);
}

async function updateLegacyMemoryPostAssets({
  imageUrl,
  postId,
  stickers,
  storagePath,
  supabase,
}: {
  imageUrl: string;
  postId: string;
  stickers: StickerSelection[];
  storagePath: string;
  supabase: SupabaseAdminClient;
}) {
  const { error } = await supabase
    .from("memory_posts")
    .update({
      image_url: imageUrl,
      storage_path: storagePath,
      stickers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }
}

async function updateLegacyMemoryPostStickers({
  postId,
  stickers,
  supabase,
}: {
  postId: string;
  stickers: StickerSelection[];
  supabase: SupabaseAdminClient;
}) {
  const { error } = await supabase
    .from("memory_posts")
    .update({
      stickers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function moderatePostAction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const intent = String(formData.get("intent") ?? "") as MemoryPostStatus;

  if (!["approved", "rejected", "removed"].includes(intent)) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: post, error: postError } = await supabase
    .from("memory_posts")
    .select("board_id, clerk_user_id, profile_id, status")
    .eq("id", postId)
    .single();

  if (postError) {
    throw new Error(postError.message);
  }

  const boardId = String(post.board_id);
  const actorClerkUserId = await requireBoardAdmin(boardId);

  if (post.status === intent) {
    return;
  }

  const occurredAt = new Date().toISOString();
  const { error } = await supabase
    .from("memory_posts")
    .update({ status: intent, updated_at: occurredAt })
    .eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }

  const board = await getBoardById(boardId);
  if (board) {
    await createMemoryPostModeratedNotification({
      actorClerkUserId,
      board,
      occurredAt,
      postId,
      recipientClerkUserId: post.clerk_user_id,
      recipientProfileId: post.profile_id,
      status: intent as "approved" | "rejected" | "removed",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

export async function updateOwnMemoryPostAction(
  postId: string,
  returnPath: string,
  formData: FormData,
) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: post, error: postError } = await supabase
    .from("memory_posts")
    .select("id, board_id, event_id, profile_id, user_id, clerk_user_id")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    throw new Error(postError.message);
  }

  const safeReturnPath = normalizeMemoryReturnPath(returnPath);

  if (!post) {
    redirect(safeReturnPath);
  }

  const isOwner =
    post.profile_id === profile.id ||
    post.user_id === profile.id ||
    post.clerk_user_id === profile.clerkUserId;

  if (!isOwner) {
    throw new Error("You can only edit memories you posted.");
  }

  const message = clean(formData.get("message"));
  const memoryPostStyle = normalizeMemoryPostStyleSelection({
    stickyNoteStyle: formData.get("stickyNoteStyle"),
    memoryPenStyle: formData.get("memoryPenStyle"),
  });

  if (!message) {
    throw new Error("Write a message before saving.");
  }

  if (message.length > 1200) {
    throw new Error("Messages must be 1200 characters or fewer.");
  }

  const { error: updateError } = await supabase
    .from("memory_posts")
    .update({
      caption: message,
      sticky_note_style: memoryPostStyle.stickyNoteStyle,
      message_pen_style: memoryPostStyle.memoryPenStyle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const boardId = String(post.board_id ?? post.event_id ?? "");
  const board = boardId ? await getBoardById(boardId) : null;

  if (board) {
    revalidatePath(`/boards/${board.id}`);

    if (board.boardType === "official_event") {
      revalidatePath(`/events/${board.slug}`);
      revalidatePath(`/events/${board.slug}/board`);
      revalidatePath(`/official-events/${board.id}`);
      revalidatePath(`/official-events/${board.id}/board`);
    }
  }

  revalidatePath(safeReturnPath);
  redirect(safeReturnPath);
}

export async function deleteOwnMemoryPostAction(
  postId: string,
  returnPath: string,
) {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: post, error: postError } = await supabase
    .from("memory_posts")
    .select("id, board_id, profile_id, user_id, clerk_user_id, storage_path")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    throw new Error(postError.message);
  }

  if (!post) {
    redirect(returnPath);
  }

  const isOwner =
    post.profile_id === profile.id ||
    post.user_id === profile.id ||
    post.clerk_user_id === profile.clerkUserId;

  if (!isOwner) {
    throw new Error("You can only delete memories you posted.");
  }

  const boardId = String(post.board_id ?? "");
  const board = boardId ? await getBoardById(boardId) : null;
  const mediaRows = await getPostMediaForDeletion(postId, supabase);
  const legacyStoragePath =
    typeof post.storage_path === "string" && post.storage_path.length > 0
      ? post.storage_path
      : null;

  const { error: deleteError } = await supabase
    .from("memory_posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await removePostMediaFiles({
    legacyStoragePath,
    mediaRows,
    supabase,
  });

  if (board) {
    revalidatePath(`/boards/${board.id}`);

    if (board.boardType === "official_event") {
      revalidatePath(`/events/${board.slug}`);
      revalidatePath(`/events/${board.slug}/board`);
      revalidatePath(`/official-events/${board.id}`);
      revalidatePath(`/official-events/${board.id}/board`);
    }
  }

  revalidatePath(returnPath);
  redirect(returnPath);
}

async function getPostMediaForDeletion(
  postId: string,
  supabase: SupabaseAdminClient,
) {
  const { data, error } = await supabase
    .from("memory_post_media")
    .select("storage_bucket, storage_path")
    .eq("post_id", postId);

  if (error) {
    if (isMissingNormalizedMemoryTableError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []).flatMap((row) => {
    const storageBucket = String(row.storage_bucket ?? "");
    const storagePath = String(row.storage_path ?? "");

    if (!storageBucket || !storagePath || storageBucket === "legacy-external") {
      return [];
    }

    return [{ storageBucket, storagePath }];
  });
}

async function removePostMediaFiles({
  legacyStoragePath,
  mediaRows,
  supabase,
}: {
  legacyStoragePath: string | null;
  mediaRows: Array<{ storageBucket: string; storagePath: string }>;
  supabase: SupabaseAdminClient;
}) {
  const byBucket = new Map<string, Set<string>>();

  for (const media of mediaRows) {
    const paths = byBucket.get(media.storageBucket) ?? new Set<string>();
    paths.add(media.storagePath);
    byBucket.set(media.storageBucket, paths);
  }

  if (legacyStoragePath) {
    const paths = byBucket.get(legacyMemoryPhotoBucket) ?? new Set<string>();
    paths.add(legacyStoragePath);
    byBucket.set(legacyMemoryPhotoBucket, paths);
  }

  await Promise.all(
    Array.from(byBucket.entries()).map(([bucket, paths]) =>
      supabase.storage.from(bucket).remove(Array.from(paths)),
    ),
  );
}

export type CreateMemoryCommentState = {
  error: string | null;
  ok: boolean;
};

export async function createMemoryCommentAction(
  boardId: string,
  postId: string,
  _returnPath: string,
  _prevState: CreateMemoryCommentState,
  formData: FormData,
): Promise<CreateMemoryCommentState> {
  const profile = await ensureUserProfile();

  if (!profile) {
    return { error: "Sign in to comment.", ok: false };
  }

  const body = clean(formData.get("body"));
  const parentCommentId = clean(formData.get("parentCommentId"));

  if (!body) {
    return { error: "Write a comment before posting.", ok: false };
  }

  if (body.length > 500) {
    return { error: "Comments must be 500 characters or fewer.", ok: false };
  }

  const board = await getAccessibleBoardById(boardId, profile);
  const supabase = getSupabaseAdminClient();

  if (!board || !supabase) {
    return { error: "This board is not available for comments.", ok: false };
  }

  const { data: post, error: postError } = await supabase
    .from("memory_posts")
    .select("id, board_id, status")
    .eq("id", postId)
    .eq("board_id", board.id)
    .eq("status", "approved")
    .maybeSingle();

  if (postError) {
    return { error: postError.message, ok: false };
  }

  if (!post) {
    return { error: "That memory is not available for comments.", ok: false };
  }

  let replyParentId: string | null = null;

  if (parentCommentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from("memory_post_comments")
      .select("id, parent_comment_id")
      .eq("id", parentCommentId)
      .eq("post_id", post.id)
      .maybeSingle();

    if (parentError) {
      if (isMissingParentCommentColumnError(parentError)) {
        return {
          error:
            "Comment replies need the latest Supabase migration. Run supabase/migrations/0013_ensure_memory_comment_replies.sql, then try again.",
          ok: false,
        };
      }

      return { error: parentError.message, ok: false };
    }

    if (!parentComment) {
      return { error: "That comment is not available for replies.", ok: false };
    }

    if (parentComment.parent_comment_id) {
      return { error: "Reply to the original comment thread.", ok: false };
    }

    replyParentId = String(parentComment.id);
  }

  const commentPayload = {
    post_id: post.id,
    board_id: board.id,
    ...(replyParentId ? { parent_comment_id: replyParentId } : {}),
    profile_id: profile.id,
    clerk_user_id: profile.clerkUserId,
    author_display_name:
      profile.displayName || profile.email || "Evespace Friend",
    body,
  };

  const { data: comment, error } = await supabase
    .from("memory_post_comments")
    .insert(commentPayload)
    .select("id")
    .single();

  if (error) {
    if (isMissingParentCommentColumnError(error)) {
      return {
        error:
          "Comment replies need the latest Supabase migration. Run supabase/migrations/0013_ensure_memory_comment_replies.sql, then try again.",
        ok: false,
      };
    }

    return { error: error.message, ok: false };
  }

  await createMemoryCommentNotifications({
    actor: profile,
    board,
    commentId: String(comment.id),
    parentCommentId: replyParentId,
    postId: post.id,
  });

  if (_returnPath.startsWith("/")) {
    revalidatePath(_returnPath);
  }

  if (board.boardType === "official_event") {
    revalidatePath(`/events/${board.slug}/board`);
    revalidatePath(`/official-events/${board.id}/board`);
  } else {
    revalidatePath(`/boards/${board.id}`);
  }
  revalidatePath("/notifications");
  return { error: null, ok: true };
}

function isMissingParentCommentColumnError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (message.includes("parent_comment_id") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

function readStickers(
  formData: FormData,
  options: { rejectOverLimit?: boolean } = {},
): StickerSelection[] {
  const raw = String(formData.get("stickers") ?? "[]");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  if (options.rejectOverLimit && parsed.length > 3) {
    throw new Error("Official event posts can include up to 3 stickers.");
  }

  const usedPlacements = new Set<string>();

  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const selection = item as Record<string, unknown>;
    const placement = selection.placement;

    if (
      typeof selection.stickerId !== "string" ||
      (placement !== "top_left" &&
        placement !== "top_right" &&
        placement !== "bottom_left" &&
        placement !== "bottom_right") ||
      usedPlacements.has(placement)
    ) {
      return [];
    }

    usedPlacements.add(placement);
    return [
      {
        stickerId: selection.stickerId,
        placement: placement as StickerPlacement,
      },
    ];
  }).slice(0, 3);
}

function clean(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}

function normalizeMemoryReturnPath(returnPath: string, fallback = "/dashboard") {
  const next = returnPath.trim();

  if (next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return fallback;
}

function createMemoryPostRotation() {
  return Math.round((Math.random() * 3 - 1.5) * 10) / 10;
}

function clampUnitInterval(value: number) {
  return Math.min(1, Math.max(0, value));
}

function sanitizePersistedOverlay(sticker: PlacedSticker): boolean {
  return (
    typeof sticker.id === "string" &&
    sticker.id.length > 0 &&
    typeof sticker.postId === "string" &&
    sticker.postId.length > 0 &&
    typeof sticker.stickerId === "string" &&
    isRegisteredStickerId(sticker.stickerId) &&
    Number.isFinite(sticker.x) &&
    Number.isFinite(sticker.y) &&
    sticker.x >= 0 &&
    sticker.x <= 1 &&
    sticker.y >= 0 &&
    sticker.y <= 1
  );
}

function overlayToJson(sticker: PlacedSticker) {
  return {
    id: sticker.id,
    stickerId: sticker.stickerId,
    x: clampUnitInterval(sticker.x),
    y: clampUnitInterval(sticker.y),
    rotation: Number.isFinite(sticker.rotation) ? sticker.rotation : 0,
    size:
      Number.isFinite(sticker.size) && sticker.size > 20
        ? Math.min(sticker.size, 140)
        : 68,
  };
}

export async function syncOverlayStickersAction(payload: {
  boardId: string;
  stickers: PlacedSticker[];
}) {
  const profile = await ensureUserProfile();

  if (!profile) {
    throw new Error("Sign in required.");
  }

  const board = await getAccessibleBoardById(payload.boardId, profile);

  if (!board) {
    throw new Error("Board not found.");
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const incomingByPost = new Map<string, PlacedSticker[]>();

  if (!canUsePremiumStickers(profile)) {
    throw new Error("Sign in to use stickers.");
  }

  for (const sticker of payload.stickers) {
    if (!sanitizePersistedOverlay(sticker)) {
      continue;
    }

    const list = incomingByPost.get(sticker.postId) ?? [];

    if (list.length >= 3) {
      continue;
    }

    list.push(sticker);
    incomingByPost.set(sticker.postId, list);
  }

  const { data: ownPosts, error: postsError } = await supabase
    .from("memory_posts")
    .select("id")
    .eq("board_id", board.id)
    .eq("profile_id", profile.id);

  if (postsError) {
    throw new Error(postsError.message);
  }

  const ownedIds = new Set((ownPosts ?? []).map((row) => String(row.id)));

  for (const postId of ownedIds) {
    const rawList = incomingByPost.get(postId) ?? [];

    if (board.boardType === "official_event" && rawList.length > 3) {
      throw new Error("Official event posts can include up to 3 stickers.");
    }

    const sanitized = rawList.filter(sanitizePersistedOverlay).slice(0, 3);
    const savedNormalized = await replaceOverlayStickerRows({
      boardId: board.id,
      postId,
      stickers: sanitized,
      supabase,
    });

    if (!savedNormalized) {
      await updateLegacyOverlayStickers({
        postId,
        profileId: profile.id,
        stickers: sanitized,
        supabase,
      });
    } else {
      await updateLegacyOverlayStickers({
        postId,
        profileId: profile.id,
        stickers: [],
        supabase,
      });
    }
  }

  revalidatePath(`/boards/${board.id}`);

  if (board.boardType === "official_event") {
    revalidatePath(`/events/${board.slug}/board`);
    revalidatePath(`/events/${board.slug}`);
    revalidatePath(`/official-events/${board.id}/board`);
    revalidatePath(`/official-events/${board.id}`);
  }
}

async function replaceOverlayStickerRows({
  boardId,
  postId,
  stickers,
  supabase,
}: {
  boardId: string;
  postId: string;
  stickers: PlacedSticker[];
  supabase: SupabaseAdminClient;
}) {
  const deleteResult = await supabase
    .from("memory_post_stickers")
    .delete()
    .eq("post_id", postId)
    .eq("sticker_kind", "overlay");

  if (deleteResult.error) {
    if (isMissingNormalizedMemoryTableError(deleteResult.error)) {
      return false;
    }

    throw new Error(deleteResult.error.message);
  }

  if (stickers.length === 0) {
    return true;
  }

  const { error } = await supabase.from("memory_post_stickers").insert(
    stickers.map((sticker, index) => ({
      post_id: postId,
      board_id: boardId,
      sticker_id: sticker.stickerId,
      sticker_kind: "overlay",
      x: clampUnitInterval(sticker.x),
      y: clampUnitInterval(sticker.y),
      rotation: Number.isFinite(sticker.rotation) ? sticker.rotation : 0,
      size:
        Number.isFinite(sticker.size) && sticker.size > 20
          ? Math.min(sticker.size, 140)
          : 68,
      client_sticker_id: sticker.id,
      sort_order: index,
    })),
  );

  if (!error) {
    return true;
  }

  if (isMissingNormalizedMemoryTableError(error)) {
    return false;
  }

  throw new Error(error.message);
}

async function updateLegacyOverlayStickers({
  postId,
  profileId,
  stickers,
  supabase,
}: {
  postId: string;
  profileId: string;
  stickers: PlacedSticker[];
  supabase: SupabaseAdminClient;
}) {
  const { error } = await supabase
    .from("memory_posts")
    .update({
      overlay_stickers: stickers.map(overlayToJson),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("profile_id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}

function isLegacyImageUrlRequiredError(error: MemoryPostInsertError) {
  const message = String(error?.message ?? "").toLowerCase();
  return error?.code === "23502" && message.includes("image_url");
}

function isMissingAuthorIdColumnError(error: MemoryPostInsertError) {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    error?.code === "PGRST204" ||
    (message.includes("author_id") &&
      (message.includes("could not find") || message.includes("schema cache")))
  );
}

function isMissingStorageBucketError(error: { message?: string }) {
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("bucket") && message.includes("not found");
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
