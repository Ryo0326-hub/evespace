export type UserRole = "user" | "admin" | "super_admin";

export type EventVisibility = "public" | "unlisted" | "private";

export type ModerationMode = "pre_approval" | "post_first";

export type MemoryPostStatus = "pending" | "approved" | "rejected" | "removed";

export type AppUserRole = "user" | "platform_admin" | "super_admin";

export type EventVerificationStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "rejected";

export type BoardBackgroundTheme =
  | "space"
  | "milky_way"
  | "festival_night"
  | "scrapbook"
  | "pastel_sky"
  | "dark_minimal";

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

export type StickerCategoryId = "cosmic" | "festival" | "cute" | "love";

export type StickerId =
  | "starburst"
  | "moon"
  | "planet"
  | "ticket"
  | "confetti"
  | "camera"
  | "cloud"
  | "flower"
  | "heart"
  | "ribbon";

export type StickerOption = {
  id: StickerId;
  categoryId: StickerCategoryId;
  name: string;
  description: string;
  label: string;
  accentClassName: string;
};

export type StickerCategory = {
  id: StickerCategoryId;
  name: string;
  description: string;
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

export type Event = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
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
  visibility: EventVisibility;
  starX: number;
  starY: number;
  starSize: number;
  starBrightness: number;
  createdBy: string | null;
  createdByProfileId: string | null;
  createdByClerkUserId: string | null;
  verificationStatus: EventVerificationStatus;
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

export type EventSchedule = {
  id: string;
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

export type MemoryPost = {
  id: string;
  eventId: string;
  userId: string | null;
  profileId: string | null;
  clerkUserId: string | null;
  authorDisplayName: string | null;
  imageUrl: string;
  storagePath: string | null;
  caption: string | null;
  frameStyle: FrameStyle;
  stickyNoteStyle: StickyNoteStyle;
  stickerId: string | null;
  boardX: number | null;
  boardY: number | null;
  rotation: number;
  status: MemoryPostStatus;
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
  visibility?: EventVisibility;
  starX?: number;
  starY?: number;
  starSize?: number;
  starBrightness?: number;
  officialWebsiteUrl?: string | null;
  officialSocialUrl?: string | null;
  organizerEmail?: string | null;
  verificationStatus?: EventVerificationStatus;
};

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
