import type { Event, EventSchedule, MemoryPost, Profile } from "@/types/evespace";

type DbEvent = Record<string, unknown>;

export function mapEvent(row: DbEvent): Event {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    description: (row.description as string | null) ?? null,
    category: (row.category as string | null) ?? null,
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
      row.verification_status === "rejected"
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

export function mapSchedule(row: DbEvent): EventSchedule {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
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
    eventId: String(row.event_id),
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
    value === "milky_way" ||
    value === "festival_night" ||
    value === "scrapbook" ||
    value === "pastel_sky" ||
    value === "dark_minimal"
  ) {
    return value;
  }

  return "space";
}
