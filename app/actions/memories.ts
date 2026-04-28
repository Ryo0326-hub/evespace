"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { requireBoardAdmin } from "@/lib/auth/permissions";
import { canPostToBoard, getAccessibleBoardById } from "@/lib/data/boards";
import { getEventBySlug } from "@/lib/data/events";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { acceptedImageTypes, maxUploadSizeBytes } from "@/lib/constants";
import { isRegisteredStickerId } from "@/lib/stickers/sticker-registry";
import type {
  MemoryPostStatus,
  PlacedSticker,
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
  const supabase = getSupabaseAdminClient();

  if (!board || !supabase || !(await canPostToBoard(board, profile))) {
    throw new Error("Memory posting is not configured.");
  }

  if (!(photo instanceof File) || photo.size === 0) {
    throw new Error("Choose a photo before posting.");
  }

  if (!acceptedImageTypes.includes(photo.type)) {
    throw new Error("Use a JPG, PNG, or WebP image.");
  }

  if (photo.size > maxUploadSizeBytes) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${board.id}/${profile.clerkUserId}/${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await photo.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("memory-photos")
    .upload(storagePath, bytes, {
      contentType: photo.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("memory-photos").getPublicUrl(storagePath);
  const status = "approved";

  const { error } = await supabase.from("memory_posts").insert({
    board_id: board.id,
    event_id: board.boardType === "official_event" ? board.id : null,
    profile_id: profile.id,
    clerk_user_id: profile.clerkUserId,
    author_display_name:
      clean(formData.get("authorDisplayName")) ||
      profile.displayName ||
      profile.email ||
      "Anonymous",
    image_url: publicUrl,
    storage_path: storagePath,
    caption: clean(formData.get("caption")),
    stickers: readStickers(formData),
    status,
    frame_style: "none",
    sticky_note_style: "default",
    rotation: 0,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(returnPath);
  if (board.boardType === "official_event") {
    revalidatePath(`/events/${board.slug}`);
  }
  redirect(`${returnPath}?posted=approved`);
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
    .select("board_id")
    .eq("id", postId)
    .single();

  if (postError) {
    throw new Error(postError.message);
  }

  await requireBoardAdmin(String(post.board_id));

  const { error } = await supabase
    .from("memory_posts")
    .update({ status: intent, updated_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

function readStickers(formData: FormData): StickerSelection[] {
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
    const sanitized = rawList.filter(sanitizePersistedOverlay).slice(0, 3);
    const overlayJson = sanitized.map(overlayToJson);

    const { error } = await supabase
      .from("memory_posts")
      .update({
        overlay_stickers: overlayJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("profile_id", profile.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/boards/${board.id}`);

  if (board.boardType === "official_event") {
    revalidatePath(`/events/${board.slug}/board`);
    revalidatePath(`/events/${board.slug}`);
  }
}
