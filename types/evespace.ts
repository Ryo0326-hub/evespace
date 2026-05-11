export type UserRole = "user" | "admin" | "super_admin";

export type BoardType = "official_event" | "private_memory";

export type BoardVisibility = "public" | "unlisted" | "private";

export type EventVisibility = BoardVisibility;

export type BoardSharingScope =
  | "owner_only"
  | "followers"
  | "selected_users"
  | "public";

export type ModerationMode = "pre_approval" | "post_first";

export type MemoryPostStatus = "pending" | "approved" | "rejected" | "removed";

export type AppUserRole = "user" | "platform_admin" | "super_admin";

export type VerificationStatus =
  | "not_applicable"
  | "unverified"
  | "pending_review"
  | "verified"
  | "rejected";

export type EventVerificationStatus = Exclude<VerificationStatus, "not_applicable">;

export type BoardBackgroundTheme =
  | "soft_cream"
  | "pale_blue"
  | "pale_pink"
  | "pale_green"
  | "pale_lavender";

export type FrameStyle =
  | "none"
  | "polaroid"
  | "soft_rounded"
  | "film"
  | "festival"
  | "space_glow";

export type StickyNoteStyle =
  | "default"
  | "yellow"
  | "pink"
  | "blue"
  | "glass";

export type StickerCategory = "pixel" | "doodle" | "clay";

export type StickerId = string;

export type Sticker = {
  id: StickerId;
  name: string;
  category: StickerCategory;
  src: string;
};

export type StickerOption = Sticker;

export type StickerPlacement =
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right";

export type StickerSelection = {
  stickerId: StickerId;
  placement: StickerPlacement;
};

export type PlacedSticker = {
  id: string;
  postId: string;
  stickerId: StickerId;
  x: number;
  y: number;
  rotation: number;
  size: number;
};

export type Board = {
  id: string;
  boardType: BoardType;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  ownerProfileId: string | null;
  ownerClerkUserId: string;
  ownerDisplayName: string | null;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  sellingGoods: boolean;
  goodsDescription: string | null;
  boardBackgroundTheme: BoardBackgroundTheme;
  moderationMode: ModerationMode;
  visibility: BoardVisibility;
  sharingScope: BoardSharingScope;
  starX: number;
  starY: number;
  starSize: number;
  starBrightness: number;
  createdBy: string | null;
  createdByProfileId: string | null;
  createdByClerkUserId: string | null;
  verificationStatus: VerificationStatus;
  verificationRequestedAt: string | null;
  verificationReviewedAt: string | null;
  verificationReviewedBy: string | null;
  verificationNotes: string | null;
  officialWebsiteUrl: string | null;
  officialSocialUrl: string | null;
  organizerEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Event = Board;

export type EventSchedule = {
  id: string;
  boardId: string;
  eventId: string;
  title: string;
  description: string | null;
  locationName: string | null;
  startTime: string | null;
  endTime: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Serialized in DB (per row; no postId). */
export type OverlayStickerPersisted = Omit<PlacedSticker, "postId">;

export type MemoryPost = {
  id: string;
  boardId: string | null;
  eventId: string;
  userId: string | null;
  profileId: string | null;
  clerkUserId: string | null;
  authorDisplayName: string | null;
  imageUrl: string;
  storagePath: string | null;
  caption: string | null;
  /** Legacy corner placements on the photo. */
  stickers: StickerSelection[];
  /** Draggable sticker overlays (saved per post). */
  overlayStickers: PlacedSticker[];
  frameStyle: FrameStyle;
  stickyNoteStyle: StickyNoteStyle;
  stickerId: string | null;
  boardX: number | null;
  boardY: number | null;
  rotation: number;
  status: MemoryPostStatus;
  comments: MemoryPostComment[];
  createdAt: string;
  updatedAt: string;
};

export type MemoryPostComment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  boardId: string | null;
  profileId: string | null;
  clerkUserId: string | null;
  authorDisplayName: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type GalaxyStar = {
  id: string;
  type: "decorative" | "event";
  x: number;
  y: number;
  radius: number;
  brightness: number;
  eventId?: string;
  eventSlug?: string;
};

export type EventInput = {
  title: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  locationName?: string | null;
  address?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sellingGoods?: boolean;
  goodsDescription?: string | null;
  boardBackgroundTheme?: BoardBackgroundTheme;
  moderationMode?: ModerationMode;
  visibility?: BoardVisibility;
  sharingScope?: BoardSharingScope;
  boardType?: BoardType;
  starX?: number;
  starY?: number;
  starSize?: number;
  starBrightness?: number;
  officialWebsiteUrl?: string | null;
  officialSocialUrl?: string | null;
  organizerEmail?: string | null;
  verificationStatus?: VerificationStatus;
};

export type BoardInput = EventInput;

export type Profile = {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  role: AppUserRole;
  createdAt: string;
  updatedAt: string;
};

export type FollowCounts = {
  followers: number;
  following: number;
};

export type FollowRelationshipStatus =
  | "none"
  | "requested"
  | "following"
  | "blocked"
  | "blocked_by";

export type FollowRequest = {
  id: string;
  requester: Profile;
  requestedProfileId: string;
  status: "pending" | "accepted" | "denied";
  createdAt: string;
};

export type NotificationType =
  | "followed_you"
  | "you_followed"
  | "follow_requested"
  | "memory_post_added"
  | "board_created"
  | "planet_level_up"
  | "friend_board_created";

export type AppNotification = {
  id: string;
  recipientProfileId: string | null;
  recipientClerkUserId: string;
  actorProfileId: string | null;
  actorClerkUserId: string | null;
  actorDisplayName: string | null;
  notificationType: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  important: boolean;
  emailSentAt: string | null;
  emailError: string | null;
  followRequestStatus: FollowRequest["status"] | null;
  createdAt: string;
};
