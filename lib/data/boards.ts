import { mapBoard } from "@/lib/data/mappers";
import { canReviewOfficialEvents } from "@/lib/auth/site-owner";
import { isPublicOfficialEventStatus } from "@/lib/official-events/approval-utils.mjs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_BOARD_THEME } from "@/lib/board-themes";
import { generateStarCoordinate, slugify } from "@/lib/utils";
import type {
  Board,
  BoardInput,
  BoardSharingScope,
  Profile,
} from "@/types/evespace";

const BOARD_SELECT = "*, profiles:owner_profile_id(display_name, avatar_url, clerk_user_id)";

export async function getPublicOfficialBoards(): Promise<Board[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "official_event")
    .eq("visibility", "public")
    .eq("official_sharing_scope", "public")
    .eq("verification_status", "verified")
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) {
    logBoardDataError("Failed to load public official boards", error);
    return [];
  }

  return data.map(mapBoard);
}

export async function getPublicMemoryBoards(): Promise<Board[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "private_memory")
    .eq("sharing_scope", "public")
    .order("created_at", { ascending: false });

  if (error) {
    logBoardDataError("Failed to load public memory boards", error);
    return [];
  }

  return data.map(mapBoard);
}

export async function getPublicGalaxyBoards(): Promise<Board[]> {
  const [officialBoards, publicMemoryBoards] = await Promise.all([
    getPublicOfficialBoards(),
    getPublicMemoryBoards(),
  ]);

  return sortGalaxyBoards([...officialBoards, ...publicMemoryBoards]);
}

export async function getOfficialBoardBySlug(slug: string): Promise<Board | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("slug", slug)
    .eq("board_type", "official_event")
    .eq("visibility", "public")
    .eq("verification_status", "verified")
    .maybeSingle();

  if (error) {
    logBoardDataError("Failed to load official board by slug", error);
    return null;
  }

  return data ? mapBoard(data) : null;
}

export async function getBoardById(boardId: string): Promise<Board | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("id", boardId)
    .maybeSingle();

  if (error) {
    logBoardDataError("Failed to load board by id", error);
    return null;
  }

  return data ? mapBoard(data) : null;
}

export async function getAccessibleBoardById(
  boardId: string,
  profile: Profile | null,
): Promise<Board | null> {
  const board = await getBoardById(boardId);

  if (!board) {
    return null;
  }

  if (board.boardType === "official_event") {
    return (await canViewOfficialEventBoard(board, profile)) ? board : null;
  }

  if (await canViewPrivateBoard(board, profile)) {
    return board;
  }

  return null;
}

export async function canViewPrivateBoard(board: Board, profile: Profile | null) {
  if (board.boardType !== "private_memory") {
    return false;
  }

  if (board.sharingScope === "public" || board.visibility === "unlisted") {
    return true;
  }

  if (!profile) {
    return false;
  }

  if (board.ownerProfileId === profile.id || board.ownerClerkUserId === profile.clerkUserId) {
    return true;
  }

  if (board.sharingScope === "followers" && board.ownerProfileId) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return false;
    }

    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_profile_id", profile.id)
      .eq("following_profile_id", board.ownerProfileId)
      .maybeSingle();

    return Boolean(data);
  }

  return false;
}

export async function canViewOfficialEventBoard(
  board: Board,
  profile: Profile | null,
) {
  if (board.boardType !== "official_event") {
    return false;
  }

  if ((await canManageBoard(board.id, profile)) || canReviewOfficialEvents(profile)) {
    return true;
  }

  if (!isPublicOfficialEventStatus(board.verificationStatus)) {
    return false;
  }

  if (board.officialSharingScope === "public") {
    return board.visibility === "public";
  }

  if (!profile) {
    return false;
  }

  if (board.officialSharingScope === "selected_people") {
    const email = profile.email?.toLowerCase() ?? "";
    return (
      board.allowedUserIds.includes(profile.id) ||
      Boolean(email && board.allowedEmails.includes(email))
    );
  }

  if (board.officialSharingScope === "organization") {
    const domain = getEmailDomain(profile.email);
    return Boolean(domain && board.allowedOrganizationDomains.includes(domain));
  }

  return false;
}

export async function canPostToBoard(board: Board, profile: Profile | null) {
  if (!profile) {
    return false;
  }

  if (board.ownerProfileId === profile.id || board.ownerClerkUserId === profile.clerkUserId) {
    return true;
  }

  if (board.boardType === "official_event") {
    if (!(await canViewOfficialEventBoard(board, profile))) {
      return false;
    }

    return (
      board.postingPermission === "signed_in_users" ||
      (await canManageBoard(board.id, profile))
    );
  }

  if (board.sharingScope === "followers") {
    return canViewPrivateBoard(board, profile);
  }

  return board.sharingScope === "public";
}

export async function canManageBoard(boardId: string, profile: Profile | null) {
  if (!profile) {
    return false;
  }

  if (profile.role === "platform_admin" || profile.role === "super_admin") {
    return true;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  const { data } = await supabase
    .from("board_members")
    .select("id")
    .eq("board_id", boardId)
    .eq("clerk_user_id", profile.clerkUserId)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  return Boolean(data);
}

export async function getOwnedPrivateBoards(clerkUserId: string): Promise<Board[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "private_memory")
    .eq("owner_clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    logBoardDataError("Failed to load owned boards", error);
    return [];
  }

  return data.map(mapBoard);
}

export async function getOwnedOfficialBoards(profile: Profile): Promise<Board[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "official_event")
    .or(`owner_profile_id.eq.${profile.id},owner_clerk_user_id.eq.${profile.clerkUserId}`)
    .order("created_at", { ascending: false });

  if (error) {
    logBoardDataError("Failed to load owned official boards", error);
    return [];
  }

  return data.map(mapBoard);
}

export async function getFriendBoards(profile: Profile): Promise<Board[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data: follows, error: followsError } = await supabase
    .from("user_follows")
    .select("following_profile_id")
    .eq("follower_profile_id", profile.id);

  if (followsError) {
    logBoardDataError("Failed to load friend follows", followsError);
    return [];
  }

  if (follows.length === 0) {
    return [];
  }

  const followingIds = follows.map((follow) => follow.following_profile_id);
  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "private_memory")
    .in("owner_profile_id", followingIds)
    .in("sharing_scope", ["followers", "public"])
    .order("created_at", { ascending: false });

  if (error) {
    logBoardDataError("Failed to load friends boards", error);
    return [];
  }

  return data.map(mapBoard);
}

export async function getUserSharedBoards(userId: string, viewerProfile: Profile): Promise<Board[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data: follow } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_profile_id", viewerProfile.id)
    .eq("following_profile_id", userId)
    .maybeSingle();

  const isFollowing = Boolean(follow);
  const allowedScopes = isFollowing ? ["followers", "public"] : ["public"];

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "private_memory")
    .eq("owner_profile_id", userId)
    .in("sharing_scope", allowedScopes)
    .order("created_at", { ascending: false });

  if (error) {
    logBoardDataError("Failed to load user shared boards", error);
    return [];
  }

  return data.map(mapBoard);
}

export async function getGalaxyBoardsForProfile(profile: Profile): Promise<Board[]> {
  const [officialBoards, publicMemoryBoards, ownedBoards, friendBoards] = await Promise.all([
    getAccessibleOfficialBoardsForProfile(profile),
    getPublicMemoryBoards(),
    getOwnedPrivateBoards(profile.clerkUserId),
    getFriendBoards(profile),
  ]);
  const byId = new Map<string, Board>();

  [...officialBoards, ...publicMemoryBoards, ...ownedBoards, ...friendBoards].forEach((board) => {
    byId.set(board.id, board);
  });

  return sortGalaxyBoards(Array.from(byId.values()));
}

export async function getAccessibleOfficialBoardsForProfile(
  profile: Profile,
): Promise<Board[]> {
  const supabase = getSupabaseAdminClient() ?? getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "official_event")
    .eq("visibility", "public")
    .eq("verification_status", "verified")
    .order("start_time", { ascending: true, nullsFirst: false });

  if (error) {
    logBoardDataError("Failed to load accessible official boards", error);
    return [];
  }

  const boards = data.map(mapBoard);
  const accessPairs = await Promise.all(
    boards.map(async (board) => ({
      board,
      canView: await canViewOfficialEventBoard(board, profile),
    })),
  );

  return accessPairs
    .filter(({ canView }) => canView)
    .map(({ board }) => board);
}

export async function getManagedOfficialBoards(profile: Profile): Promise<Board[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  if (profile.role === "platform_admin" || profile.role === "super_admin") {
    const { data, error } = await supabase
      .from("boards")
      .select(BOARD_SELECT)
      .eq("board_type", "official_event")
      .order("created_at", { ascending: false });

    if (error) {
      logBoardDataError("Failed to load official boards", error);
      return [];
    }

    return data.map(mapBoard);
  }

  const { data, error } = await supabase
    .from("board_members")
    .select("boards(*)")
    .eq("clerk_user_id", profile.clerkUserId)
    .in("role", ["owner", "admin"])
    .order("created_at", { ascending: false });

  if (error) {
    logBoardDataError("Failed to load managed official boards", error);
    return [];
  }

  return data
    .flatMap((row) => {
      const boards = row.boards;
      return Array.isArray(boards) ? boards : boards ? [boards] : [];
    })
    .map((board) => mapBoard(board as unknown as Record<string, unknown>));
}

export async function getPendingOfficialBoards(): Promise<Board[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("boards")
    .select(BOARD_SELECT)
    .eq("board_type", "official_event")
    .eq("verification_status", "pending_review")
    .order("verification_requested_at", { ascending: true, nullsFirst: false });

  if (error) {
    logBoardDataError("Failed to load pending official boards", error);
    return [];
  }

  return data.map(mapBoard);
}

export async function createPrivateBoard(input: BoardInput, profile: Profile) {
  return createBoard({
    input,
    profile,
    boardType: "private_memory",
    visibility: "private",
    sharingScope: input.sharingScope ?? "owner_only",
    verificationStatus: "not_applicable",
    moderationMode: "post_first",
  });
}

export async function createOfficialBoard(input: BoardInput, profile: Profile) {
  return createBoard({
    input,
    profile,
    boardType: "official_event",
    visibility: "public",
    sharingScope: "public",
    verificationStatus: input.verificationStatus ?? "unverified",
    moderationMode: input.moderationMode ?? "pre_approval",
  });
}

export async function updateBoard(boardId: string, input: BoardInput) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { data: null, error: "Supabase service role is not configured." };
  }

  const updatePayload: Record<string, unknown> = {
    title: input.title,
    slug: input.slug || slugify(input.title),
    description: input.description ?? null,
    category: input.category ?? null,
    start_time: input.startTime || null,
    end_time: input.endTime || null,
    location_name: input.locationName ?? null,
    address: input.address ?? null,
    google_maps_url: input.googleMapsUrl ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    selling_goods: input.sellingGoods ?? false,
    goods_description: input.goodsDescription ?? null,
    board_background_theme: input.boardBackgroundTheme ?? DEFAULT_BOARD_THEME,
    moderation_mode: input.moderationMode ?? "post_first",
    sharing_scope: input.sharingScope ?? "owner_only",
    official_website_url: input.officialWebsiteUrl ?? null,
    official_social_url: input.officialSocialUrl ?? null,
    organizer_email: input.organizerEmail ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.accessInformation !== undefined) {
    updatePayload.official_access_information = input.accessInformation ?? null;
  }

  if (input.heroImageUrl !== undefined) {
    updatePayload.hero_image_url = input.heroImageUrl ?? null;
  }

  if (input.heroImageStorageBucket !== undefined) {
    updatePayload.hero_image_storage_bucket = input.heroImageStorageBucket ?? null;
  }

  if (input.heroImageStoragePath !== undefined) {
    updatePayload.hero_image_storage_path = input.heroImageStoragePath ?? null;
  }

  if (input.officialSharingScope !== undefined) {
    updatePayload.official_sharing_scope = input.officialSharingScope;
  }

  if (input.postingPermission !== undefined) {
    updatePayload.posting_permission = input.postingPermission;
  }

  if (input.allowedUserIds !== undefined) {
    updatePayload.allowed_user_ids = sanitizeStringList(input.allowedUserIds);
  }

  if (input.allowedEmails !== undefined) {
    updatePayload.allowed_emails = sanitizeEmailList(input.allowedEmails);
  }

  if (input.allowedOrganizationDomains !== undefined) {
    updatePayload.allowed_organization_domains = sanitizeDomainList(
      input.allowedOrganizationDomains,
    );
  }

  const { data, error } = await supabase
    .from("boards")
    .update(updatePayload)
    .eq("id", boardId)
    .select(BOARD_SELECT)
    .single();

  if (error) {
    return { data: null, error: toBoardMutationError(error) };
  }

  return { data: mapBoard(data), error: null };
}

export async function deleteBoard(boardId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { error: "Supabase service role is not configured." };
  }

  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) {
    return { error: toBoardMutationError(error) };
  }

  return { error: null };
}

async function createBoard({
  input,
  profile,
  boardType,
  visibility,
  sharingScope,
  verificationStatus,
  moderationMode,
}: {
  input: BoardInput;
  profile: Profile;
  boardType: Board["boardType"];
  visibility: Board["visibility"];
  sharingScope: BoardSharingScope;
  verificationStatus: Board["verificationStatus"];
  moderationMode: Board["moderationMode"];
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { data: null, error: "Supabase service role is not configured." };
  }

  const slug = input.slug || `${slugify(input.title)}-${Date.now().toString(36)}`;
  const star = generateStarCoordinate(slug);

  const { data, error } = await supabase
    .from("boards")
    .insert({
      board_type: boardType,
      title: input.title,
      slug,
      description: input.description ?? null,
      category: input.category ?? null,
      owner_profile_id: profile.id,
      owner_clerk_user_id: profile.clerkUserId,
      visibility,
      sharing_scope: sharingScope,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      location_name: input.locationName ?? null,
      address: input.address ?? null,
      google_maps_url: input.googleMapsUrl ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      hero_image_url: input.heroImageUrl ?? null,
      hero_image_storage_bucket: input.heroImageStorageBucket ?? null,
      hero_image_storage_path: input.heroImageStoragePath ?? null,
      selling_goods: input.sellingGoods ?? false,
      goods_description: input.goodsDescription ?? null,
      board_background_theme: input.boardBackgroundTheme ?? DEFAULT_BOARD_THEME,
      moderation_mode: moderationMode,
      verification_status: verificationStatus,
      verification_requested_at:
        verificationStatus === "pending_review" ? new Date().toISOString() : null,
      official_website_url: input.officialWebsiteUrl ?? null,
      official_social_url: input.officialSocialUrl ?? null,
      organizer_email: input.organizerEmail ?? null,
      official_access_information: input.accessInformation ?? null,
      official_sharing_scope: input.officialSharingScope ?? "public",
      posting_permission: input.postingPermission ?? "signed_in_users",
      allowed_user_ids: sanitizeStringList(input.allowedUserIds),
      allowed_emails: sanitizeEmailList(input.allowedEmails),
      allowed_organization_domains: sanitizeDomainList(input.allowedOrganizationDomains),
      star_x: input.starX ?? star.x,
      star_y: input.starY ?? star.y,
      star_size: input.starSize ?? 1,
      star_brightness: input.starBrightness ?? 1,
    })
    .select(BOARD_SELECT)
    .single();

  if (error) {
    return { data: null, error: toBoardMutationError(error) };
  }

  await supabase.from("board_members").insert({
    board_id: data.id,
    profile_id: profile.id,
    clerk_user_id: profile.clerkUserId,
    role: "owner",
  });

  return { data: mapBoard(data), error: null };
}

function toBoardMutationError(error: unknown) {
  if (isMissingRefinementSchemaError(error)) {
    return "The boards database migration has not been applied yet. Run supabase/migrations/0003_boards_refinement.sql in Supabase, then refresh the app.";
  }

  return error instanceof Error
    ? error.message
    : String((error as { message?: string } | null)?.message ?? "Save failed");
}

function sortGalaxyBoards(boards: Board[]) {
  return boards.sort((a, b) => {
    if (a.boardType !== b.boardType) {
      return a.boardType === "official_event" ? -1 : 1;
    }

    if (a.boardType === "official_event" && b.boardType === "official_event") {
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
    }

    const aTime = a.startTime ? Date.parse(a.startTime) : 0;
    const bTime = b.startTime ? Date.parse(b.startTime) : 0;
    return aTime - bTime;
  });
}

function getEmailDomain(email?: string | null) {
  return email?.split("@")[1]?.toLowerCase() ?? null;
}

function sanitizeStringList(values?: string[]) {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  );
}

function sanitizeEmailList(values?: string[]) {
  return sanitizeStringList(values).map((value) => value.toLowerCase());
}

function sanitizeDomainList(values?: string[]) {
  return sanitizeStringList(values)
    .map((value) => value.toLowerCase().replace(/^@/, ""))
    .filter((value) => value.includes("."));
}

let hasWarnedAboutMissingSchema = false;

function logBoardDataError(message: string, error: unknown) {
  if (isMissingRefinementSchemaError(error)) {
    if (!hasWarnedAboutMissingSchema) {
      hasWarnedAboutMissingSchema = true;
      console.warn(
        "Evespace board schema is not available yet. Run supabase/migrations/0003_boards_refinement.sql in Supabase, then refresh the app.",
      );
    }

    return;
  }

  console.warn(message, error);
}

function isMissingRefinementSchemaError(error: unknown) {
  const next = error as { code?: string; message?: string } | null;

  return (
    next?.code === "PGRST205" ||
    Boolean(next?.message?.includes("Could not find the table 'public.boards'")) ||
    Boolean(next?.message?.includes("Could not find the table 'public.board_members'")) ||
    Boolean(next?.message?.includes("Could not find the table 'public.user_follows'"))
  );
}
