import { isRegisteredStickerId } from "@/lib/stickers/sticker-registry";
import type {
  Board,
  Event,
  EventSchedule,
  MemoryPost,
  PlacedSticker,
  Profile,
  StickerSelection,
} from "@/types/evespace";

type DbEvent = Record<string, unknown>;

export function mapBoard(row: DbEvent): Board {
  const ownerProfile = Array.isArray(row.profiles)
    ? row.profiles[0]
    : row.profiles;

  return {
    id: String(row.id),
    boardType:
      row.board_type === "official_event" || row.board_type === "private_memory"
        ? row.board_type
        : "official_event",
    title: String(row.title),
    slug: String(row.slug ?? row.id),
    description: (row.description as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    ownerProfileId:
      (row.owner_profile_id as string | null) ??
      (row.created_by_profile_id as string | null) ??
      null,
    ownerClerkUserId:
      String(
        (row.owner_clerk_user_id as string | null) ??
          (row.created_by_clerk_user_id as string | null) ??
          "",
      ),
    ownerDisplayName:
      ownerProfile && typeof ownerProfile === "object"
        ? ((ownerProfile as Record<string, unknown>).display_name as string | null) ?? null
        : null,
    startTime: (row.start_time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    locationName: (row.location_name as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    googleMapsUrl: (row.google_maps_url as string | null) ?? null,
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    sellingGoods: Boolean(row.selling_goods),
    goodsDescription: (row.goods_description as string | null) ?? null,
    boardBackgroundTheme: EventTheme(row.board_background_theme),
    moderationMode:
      row.moderation_mode === "post_first" ? "post_first" : "pre_approval",
    visibility:
      row.visibility === "private" || row.visibility === "unlisted"
        ? row.visibility
        : "public",
    sharingScope:
      row.sharing_scope === "followers" ||
      row.sharing_scope === "selected_users" ||
      row.sharing_scope === "public"
        ? row.sharing_scope
        : "owner_only",
    starX: Number(row.star_x),
    starY: Number(row.star_y),
    starSize: Number(row.star_size ?? 1),
    starBrightness: Number(row.star_brightness ?? 1),
    createdBy: (row.created_by as string | null) ?? null,
    createdByProfileId: (row.created_by_profile_id as string | null) ?? null,
    createdByClerkUserId:
      (row.created_by_clerk_user_id as string | null) ??
      (row.created_by as string | null) ??
      null,
    verificationStatus:
      row.verification_status === "pending_review" ||
      row.verification_status === "verified" ||
      row.verification_status === "rejected" ||
      row.verification_status === "not_applicable"
        ? row.verification_status
        : "unverified",
    verificationRequestedAt:
      (row.verification_requested_at as string | null) ?? null,
    verificationReviewedAt:
      (row.verification_reviewed_at as string | null) ?? null,
    verificationReviewedBy:
      (row.verification_reviewed_by as string | null) ?? null,
    verificationNotes: (row.verification_notes as string | null) ?? null,
    officialWebsiteUrl: (row.official_website_url as string | null) ?? null,
    officialSocialUrl: (row.official_social_url as string | null) ?? null,
    organizerEmail: (row.organizer_email as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapEvent(row: DbEvent): Event {
  return mapBoard(row);
}

export function mapSchedule(row: DbEvent): EventSchedule {
  return {
    id: String(row.id),
    boardId: String(row.board_id ?? row.event_id),
    eventId: String(row.event_id ?? row.board_id),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    locationName: (row.location_name as string | null) ?? null,
    startTime: (row.start_time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapMemoryPost(row: DbEvent): MemoryPost {
  return {
    id: String(row.id),
    boardId: (row.board_id as string | null) ?? null,
    eventId: String(row.event_id ?? row.board_id ?? ""),
    userId:
      (row.user_id as string | null) ??
      (row.clerk_user_id as string | null) ??
      null,
    profileId: (row.profile_id as string | null) ?? null,
    clerkUserId: (row.clerk_user_id as string | null) ?? null,
    authorDisplayName: (row.author_display_name as string | null) ?? null,
    imageUrl: String(row.image_url),
    storagePath: (row.storage_path as string | null) ?? null,
    caption: (row.caption as string | null) ?? null,
    stickers: parseStickers(row.stickers),
    overlayStickers: parseOverlayStickers(row.overlay_stickers, String(row.id)),
    frameStyle:
      row.frame_style === "polaroid" ||
      row.frame_style === "soft_rounded" ||
      row.frame_style === "film" ||
      row.frame_style === "festival" ||
      row.frame_style === "space_glow"
        ? row.frame_style
        : "none",
    stickyNoteStyle:
      row.sticky_note_style === "yellow" ||
      row.sticky_note_style === "pink" ||
      row.sticky_note_style === "blue" ||
      row.sticky_note_style === "glass"
        ? row.sticky_note_style
        : "default",
    stickerId: (row.sticker_id as string | null) ?? null,
    boardX: (row.board_x as number | null) ?? null,
    boardY: (row.board_y as number | null) ?? null,
    rotation: Number(row.rotation ?? 0),
    status:
      row.status === "approved" ||
      row.status === "rejected" ||
      row.status === "removed"
        ? row.status
        : "pending",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapProfile(row: DbEvent): Profile {
  return {
    id: String(row.id),
    clerkUserId: String(row.clerk_user_id),
    displayName: (row.display_name as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    role:
      row.role === "platform_admin" || row.role === "super_admin"
        ? row.role
        : "user",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function EventTheme(value: unknown): Event["boardBackgroundTheme"] {
  if (
    value === "pale_blue" ||
    value === "pale_pink" ||
    value === "pale_green" ||
    value === "pale_lavender"
  ) {
    return value;
  }

  return "soft_cream";
}

function clampUnitInterval(value: number) {
  return Math.min(1, Math.max(0, value));
}

function parseOverlayStickers(value: unknown, postId: string): PlacedSticker[] {
  const raw = typeof value === "string" ? safeJsonParse(value) : value;

  if (!Array.isArray(raw)) {
    return [];
  }

  const result: PlacedSticker[] = [];

  for (const item of raw.slice(0, 3)) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const sticker = item as Record<string, unknown>;
    const id = typeof sticker.id === "string" ? sticker.id : "";
    const stickerId = typeof sticker.stickerId === "string" ? sticker.stickerId : "";

    if (!id || !stickerId || !isRegisteredStickerId(stickerId)) {
      continue;
    }

    const x = Number(sticker.x);
    const y = Number(sticker.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }

    const rotation = Number(sticker.rotation);
    const size = Number(sticker.size);

    result.push({
      id,
      postId,
      stickerId,
      x: clampUnitInterval(x),
      y: clampUnitInterval(y),
      rotation: Number.isFinite(rotation) ? rotation : 0,
      size:
        Number.isFinite(size) && size > 20 ? Math.min(size, 140) : 68,
    });
  }

  return result;
}

function parseStickers(value: unknown): StickerSelection[] {
  const raw = typeof value === "string" ? safeJsonParse(value) : value;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const sticker = item as Record<string, unknown>;
    const placement = sticker.placement;

    if (
      typeof sticker.stickerId !== "string" ||
      (placement !== "top_left" &&
        placement !== "top_right" &&
        placement !== "bottom_left" &&
        placement !== "bottom_right")
    ) {
      return [];
    }

    return [{ stickerId: sticker.stickerId, placement }];
  });
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
