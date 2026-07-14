import "server-only";

import { sendImportantNotificationEmail } from "@/lib/email/activity-email";
import { sendFollowRequestEmail } from "@/lib/email/follow-request-email";
import { mapProfile } from "@/lib/data/mappers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AppNotification,
  Board,
  FollowRequest,
  NotificationType,
  Profile,
} from "@/types/evespace";

const NOTIFICATION_SELECT =
  "*, actor:actor_profile_id(display_name, email, avatar_url, clerk_user_id)";

const NOTIFICATION_TYPES: NotificationType[] = [
  "followed_you",
  "you_followed",
  "follow_requested",
  "follow_request_sent",
  "follow_request_accepted",
  "memory_post_added",
  "memory_post_commented",
  "comment_replied",
  "memory_post_moderated",
  "event_verification_updated",
  "board_created",
  "planet_level_up",
  "friend_board_created",
];

type NotificationActor = {
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  clerk_user_id?: string | null;
};

type NotificationPayload = {
  recipient: Profile;
  actor?: Profile | null;
  notificationType: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string | null;
  important?: boolean;
};

type FollowRequestRecord = {
  id: string;
  requester_profile_id: string;
  requested_profile_id: string;
  requester_clerk_user_id: string;
  requested_clerk_user_id: string;
  status: FollowRequest["status"];
  updated_at?: string | null;
};

export async function getNotificationsForProfile(
  profile: Profile,
): Promise<AppNotification[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .or(`recipient_profile_id.eq.${profile.id},recipient_clerk_user_id.eq.${profile.clerkUserId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logNotificationDataError("Failed to load notifications", error);
    return [];
  }

  const notifications = await hydrateFollowRequestStatuses(data.map(mapNotification));
  return hydrateNotificationTargetImages(notifications);
}

export async function getUnreadNotificationCount(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_clerk_user_id", clerkUserId)
    .is("read_at", null);

  if (error) {
    logNotificationDataError("Failed to count unread notifications", error);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationsRead(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_clerk_user_id", clerkUserId)
    .is("read_at", null);

  if (error) {
    logNotificationDataError("Failed to mark notifications read", error);
    return false;
  }

  return true;
}

export async function createNotification(
  payload: NotificationPayload,
): Promise<AppNotification | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  if (payload.dedupeKey) {
    const { data: existing, error: existingError } = await supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .eq("recipient_clerk_user_id", payload.recipient.clerkUserId)
      .eq("dedupe_key", payload.dedupeKey)
      .maybeSingle();

    if (existingError) {
      logNotificationDataError("Failed to check existing notification", existingError);
    }

    if (existing) {
      return mapNotification(existing);
    }
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_profile_id: payload.recipient.id,
      recipient_clerk_user_id: payload.recipient.clerkUserId,
      actor_profile_id: payload.actor?.id ?? null,
      actor_clerk_user_id: payload.actor?.clerkUserId ?? null,
      notification_type: payload.notificationType,
      title: payload.title,
      body: payload.body ?? null,
      href: payload.href ?? null,
      metadata: payload.metadata ?? {},
      dedupe_key: payload.dedupeKey ?? null,
      important: payload.important ?? false,
    })
    .select(NOTIFICATION_SELECT)
    .single();

  if (error) {
    if (isDuplicateNotificationError(error) && payload.dedupeKey) {
      const { data: existing } = await supabase
        .from("notifications")
        .select(NOTIFICATION_SELECT)
        .eq("recipient_clerk_user_id", payload.recipient.clerkUserId)
        .eq("dedupe_key", payload.dedupeKey)
        .maybeSingle();

      return existing ? mapNotification(existing) : null;
    }

    logNotificationDataError("Failed to create notification", error);
    return null;
  }

  return mapNotification(data);
}

export async function createNotifications(payloads: NotificationPayload[]) {
  return Promise.all(payloads.map((payload) => createNotification(payload)));
}

export async function createFollowRequestedNotification({
  request,
  requested,
  requester,
}: {
  request: FollowRequestRecord;
  requested: Profile;
  requester: Profile;
}) {
  const requesterName = displayName(requester);
  const requestedName = displayName(requested);
  const attemptKey = request.updated_at ?? request.id;
  const notification = await createNotification({
    recipient: requested,
    actor: requester,
    notificationType: "follow_requested",
    title: "New follow request",
    body: `${requesterName} requested to follow you.`,
    href: "/notifications",
    metadata: {
      followRequestId: request.id,
      requesterProfileId: requester.id,
    },
    dedupeKey: `follow_requested:${request.id}:${attemptKey}`,
    important: true,
  });

  await createNotification({
    recipient: requester,
    actor: requested,
    notificationType: "follow_request_sent",
    title: "Follow request sent",
    body: `Follow request sent to ${requestedName}.`,
    href: `/user/${requested.id}`,
    metadata: {
      followRequestId: request.id,
      requestedProfileId: requested.id,
    },
    dedupeKey: `follow_request_sent:${request.id}:${attemptKey}`,
  });

  if (!notification || notification.emailSentAt) {
    return;
  }

  const result = await sendFollowRequestEmail({ recipient: requested, requester });
  await updateNotificationEmailResult(notification.id, result);
}

export async function createFollowNotifications({
  acceptedAt,
  follower,
  following,
}: {
  acceptedAt: string;
  follower: Profile;
  following: Profile;
}) {
  const followingName = displayName(following);
  await createNotification({
    recipient: follower,
    actor: following,
    notificationType: "follow_request_accepted",
    title: "Follow request accepted",
    body: `${followingName} accepted your follow request.`,
    href: `/user/${following.id}`,
    metadata: {
      followingProfileId: following.id,
    },
    dedupeKey: `follow_request_accepted:${follower.id}:${following.id}:${acceptedAt}`,
  });
}

export async function createBoardCreatedNotification({
  board,
  profile,
}: {
  board: Board;
  profile: Profile;
}) {
  await createNotification({
    recipient: profile,
    actor: profile,
    notificationType: "board_created",
    title:
      board.boardType === "official_event"
        ? "Event board created"
        : "Memory board created",
    body: `${board.title} is ready in your memory space.`,
    href:
      board.boardType === "official_event"
        ? `/admin/official-events/${board.id}/edit`
        : `/boards/${board.id}`,
    metadata: {
      boardId: board.id,
      boardType: board.boardType,
    },
    dedupeKey: `board_created:${board.id}`,
  });
}

export async function createMemoryPostAddedNotifications({
  actor,
  board,
  postId,
}: {
  actor: Profile;
  board: Board;
  postId: string;
}) {
  const recipients = (await getBoardAdminProfiles(board)).filter(
    (recipient) => recipient.id !== actor.id,
  );

  if (recipients.length === 0) {
    return;
  }

  const actorName = displayName(actor);
  await createNotifications(
    recipients.map((recipient) => ({
      recipient,
      actor,
      notificationType: "memory_post_added",
      title: "New memory post",
      body: `${actorName} added a memory to ${board.title}.`,
      href: notificationHrefForBoard(board, postId),
      metadata: {
        boardId: board.id,
        postId,
      },
      dedupeKey: `memory_post_added:${postId}:${recipient.id}`,
    })),
  );
}

export async function createMemoryCommentNotifications({
  actor,
  board,
  commentId,
  parentCommentId,
  postId,
}: {
  actor: Profile;
  board: Board;
  commentId: string;
  parentCommentId: string | null;
  postId: string;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const [{ data: post }, parentResult] = await Promise.all([
    supabase
      .from("memory_posts")
      .select("profile_id, clerk_user_id")
      .eq("id", postId)
      .maybeSingle(),
    parentCommentId
      ? supabase
          .from("memory_post_comments")
          .select("profile_id, clerk_user_id")
          .eq("id", parentCommentId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const postAuthor = post
    ? await getNotificationRecipient(post.profile_id, post.clerk_user_id)
    : null;
  const parentAuthor = parentResult.data
    ? await getNotificationRecipient(
        parentResult.data.profile_id,
        parentResult.data.clerk_user_id,
      )
    : null;
  const actorName = displayName(actor);
  const href = notificationHrefForBoard(board, postId);
  const payloads: NotificationPayload[] = [];

  if (parentCommentId && parentAuthor && parentAuthor.id !== actor.id) {
    payloads.push({
      recipient: parentAuthor,
      actor,
      notificationType: "comment_replied",
      title: "New reply",
      body: `${actorName} replied to your comment.`,
      href,
      metadata: { boardId: board.id, commentId, parentCommentId, postId },
      dedupeKey: `comment_replied:${commentId}:${parentAuthor.id}`,
    });
  }

  if (
    postAuthor &&
    postAuthor.id !== actor.id &&
    !payloads.some((payload) => payload.recipient.id === postAuthor.id)
  ) {
    payloads.push({
      recipient: postAuthor,
      actor,
      notificationType: "memory_post_commented",
      title: parentCommentId ? "New reply on your memory" : "New comment",
      body: parentCommentId
        ? `${actorName} replied on your memory in ${board.title}.`
        : `${actorName} commented on your memory in ${board.title}.`,
      href,
      metadata: { boardId: board.id, commentId, postId },
      dedupeKey: `memory_post_commented:${commentId}:${postAuthor.id}`,
    });
  }

  if (payloads.length > 0) {
    await createNotifications(payloads);
  }
}

export async function createMemoryPostModeratedNotification({
  actorClerkUserId,
  board,
  occurredAt,
  postId,
  recipientClerkUserId,
  recipientProfileId,
  status,
}: {
  actorClerkUserId: string;
  board: Board;
  occurredAt: string;
  postId: string;
  recipientClerkUserId: string | null;
  recipientProfileId: string | null;
  status: "approved" | "rejected" | "removed";
}) {
  const recipient = await getNotificationRecipient(
    recipientProfileId,
    recipientClerkUserId,
  );

  if (!recipient) {
    return;
  }

  const actor = await getProfileByClerkUserId(actorClerkUserId);
  const statusLabel = status === "approved" ? "approved" : status === "removed" ? "removed" : "rejected";
  const href = notificationHrefForBoard(board, status === "approved" ? postId : null);
  const body = `Your memory in ${board.title} was ${statusLabel}.`;
  const notification = await createNotification({
    recipient,
    actor,
    notificationType: "memory_post_moderated",
    title: `Memory ${statusLabel}`,
    body,
    href,
    metadata: { boardId: board.id, postId, status },
    dedupeKey: `memory_post_moderated:${postId}:${status}:${occurredAt}:${recipient.id}`,
    important: true,
  });

  if (!notification || notification.emailSentAt) {
    return;
  }

  const result = await sendImportantNotificationEmail({
    recipient,
    subject: `Your Evespace memory was ${statusLabel}`,
    heading: `Memory ${statusLabel}`,
    message: body,
    href,
    actionLabel: "Open Evespace",
  });
  await updateNotificationEmailResult(notification.id, result);
}

export async function createEventVerificationNotification({
  actor,
  board,
  notes,
  occurredAt,
  status,
}: {
  actor: Profile;
  board: Board;
  notes?: string | null;
  occurredAt: string;
  status: "verified" | "rejected";
}) {
  const recipient = await getNotificationRecipient(
    board.ownerProfileId,
    board.ownerClerkUserId,
  );

  if (!recipient) {
    return;
  }

  const statusLabel = status === "verified" ? "verified" : "not approved";
  const href = `/official-events/${board.id}`;
  const body = `${board.title} was ${statusLabel}.${notes ? ` ${notes}` : ""}`;
  const notification = await createNotification({
    recipient,
    actor,
    notificationType: "event_verification_updated",
    title: status === "verified" ? "Event verified" : "Event verification update",
    body,
    href,
    metadata: { boardId: board.id, notes: notes ?? null, status },
    dedupeKey: `event_verification_updated:${board.id}:${status}:${occurredAt}:${recipient.id}`,
    important: true,
  });

  if (!notification || notification.emailSentAt) {
    return;
  }

  const result = await sendImportantNotificationEmail({
    recipient,
    subject: `Verification update for ${board.title}`,
    heading: notification.title,
    message: body,
    href,
    actionLabel: "View event",
  });
  await updateNotificationEmailResult(notification.id, result);
}

export async function createFriendBoardCreatedNotifications({
  actor,
  board,
}: {
  actor?: Profile | null;
  board: Board;
}) {
  if (!board.ownerProfileId || !isFriendVisibleBoard(board)) {
    return;
  }

  const owner = actor ?? (await getProfileById(board.ownerProfileId));

  if (!owner) {
    return;
  }

  const followers = await getFollowerProfiles(board.ownerProfileId);
  const ownerName = displayName(owner);

  await createNotifications(
    followers
      .filter((follower) => follower.id !== owner.id)
      .map((follower) => ({
        recipient: follower,
        actor: owner,
        notificationType: "friend_board_created",
        title: "Friend posted an event",
        body: `${ownerName} created ${board.title}.`,
        href:
          board.boardType === "official_event"
            ? `/events/${board.slug}`
            : `/boards/${board.id}`,
        metadata: {
          boardId: board.id,
          boardType: board.boardType,
        },
        dedupeKey: `friend_board_created:${board.id}:${follower.id}`,
      })),
  );
}

export async function createPlanetLevelUpNotification({
  level,
  profile,
}: {
  level: { level: number; name: string };
  profile: Profile;
}) {
  await createNotification({
    recipient: profile,
    actor: profile,
    notificationType: "planet_level_up",
    title: "Your planet leveled up",
    body: `Your planet reached Level ${level.level}: ${level.name}.`,
    href: "/profile",
    metadata: {
      level: level.level,
      levelName: level.name,
    },
    dedupeKey: `planet_level_up:${profile.id}:${level.level}`,
  });
}

function mapNotification(row: Record<string, unknown>): AppNotification {
  const actor = Array.isArray(row.actor)
    ? (row.actor[0] as NotificationActor | undefined)
    : (row.actor as NotificationActor | undefined);
  const metadata = parseMetadata(row.metadata);

  return {
    id: String(row.id),
    recipientProfileId: (row.recipient_profile_id as string | null) ?? null,
    recipientClerkUserId: String(row.recipient_clerk_user_id),
    actorProfileId: (row.actor_profile_id as string | null) ?? null,
    actorClerkUserId: (row.actor_clerk_user_id as string | null) ?? null,
    actorDisplayName: actor ? actor.display_name ?? actor.email ?? null : null,
    actorAvatarUrl: actor?.avatar_url ?? null,
    notificationType: toNotificationType(row.notification_type),
    title: String(row.title),
    body: (row.body as string | null) ?? null,
    href: (row.href as string | null) ?? null,
    metadata,
    readAt: (row.read_at as string | null) ?? null,
    important: Boolean(row.important),
    emailSentAt: (row.email_sent_at as string | null) ?? null,
    emailError: (row.email_error as string | null) ?? null,
    followRequestStatus: null,
    targetImageUrl: null,
    createdAt: String(row.created_at),
  };
}

async function hydrateNotificationTargetImages(
  notifications: AppNotification[],
): Promise<AppNotification[]> {
  const postIds = Array.from(
    new Set(
      notifications.flatMap((notification) =>
        typeof notification.metadata.postId === "string"
          ? [notification.metadata.postId]
          : [],
      ),
    ),
  );

  if (postIds.length === 0) {
    return notifications;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return notifications;

  const [{ data: posts }, { data: media }] = await Promise.all([
    supabase.from("memory_posts").select("id, image_url").in("id", postIds),
    supabase
      .from("memory_post_media")
      .select("post_id, storage_bucket, storage_path, sort_order")
      .in("post_id", postIds)
      .eq("media_type", "image")
      .order("sort_order", { ascending: true }),
  ]);

  const imageByPost = new Map<string, string>();

  for (const post of posts ?? []) {
    if (typeof post.image_url === "string" && post.image_url) {
      imageByPost.set(String(post.id), post.image_url);
    }
  }

  for (const item of media ?? []) {
    const postId = String(item.post_id);
    if (imageByPost.has(postId)) continue;
    if (!item.storage_bucket || !item.storage_path) continue;

    const { data } = supabase.storage
      .from(String(item.storage_bucket))
      .getPublicUrl(String(item.storage_path));
    if (data.publicUrl) imageByPost.set(postId, data.publicUrl);
  }

  return notifications.map((notification) => {
    const postId = notification.metadata.postId;
    return typeof postId === "string"
      ? { ...notification, targetImageUrl: imageByPost.get(postId) ?? null }
      : notification;
  });
}

async function hydrateFollowRequestStatuses(
  notifications: AppNotification[],
): Promise<AppNotification[]> {
  const requestIds = notifications.flatMap((notification) => {
    const followRequestId = notification.metadata.followRequestId;
    return typeof followRequestId === "string" ? [followRequestId] : [];
  });

  if (requestIds.length === 0) {
    return notifications;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return notifications;
  }

  const { data, error } = await supabase
    .from("user_follow_requests")
    .select("id, status")
    .in("id", Array.from(new Set(requestIds)));

  if (error) {
    logNotificationDataError("Failed to hydrate follow request status", error);
    return notifications;
  }

  const statuses = new Map(
    data.map((request) => [
      String(request.id),
      request.status === "accepted" || request.status === "denied"
        ? request.status
        : "pending",
    ]),
  );

  return notifications.map((notification) => {
    const followRequestId = notification.metadata.followRequestId;
    if (typeof followRequestId !== "string") {
      return notification;
    }

    return {
      ...notification,
      followRequestStatus: statuses.get(followRequestId) ?? null,
    };
  });
}

async function updateNotificationEmailResult(
  notificationId: string,
  result: { sent: boolean; error: string | null },
) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      email_sent_at: result.sent ? new Date().toISOString() : null,
      email_error: result.error,
    })
    .eq("id", notificationId);

  if (error) {
    logNotificationDataError("Failed to update notification email status", error);
  }
}

async function getBoardAdminProfiles(board: Board): Promise<Profile[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("board_members")
    .select("profiles:profile_id(*)")
    .eq("board_id", board.id)
    .in("role", ["owner", "admin"]);

  if (error) {
    logNotificationDataError("Failed to load board notification recipients", error);
    return [];
  }

  const profiles = data
    .flatMap((row) => {
      const nested = row.profiles;
      return Array.isArray(nested) ? nested : nested ? [nested] : [];
    })
    .map((profile) => mapProfile(profile as unknown as Record<string, unknown>));

  if (board.ownerProfileId && !profiles.some((profile) => profile.id === board.ownerProfileId)) {
    const owner = await getProfileById(board.ownerProfileId);
    if (owner) {
      profiles.push(owner);
    }
  }

  return uniqueProfiles(profiles);
}

async function getFollowerProfiles(profileId: string): Promise<Profile[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select("profiles:follower_profile_id(*)")
    .eq("following_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    logNotificationDataError("Failed to load followers for notifications", error);
    return [];
  }

  return data
    .flatMap((row) => {
      const profiles = row.profiles;
      return Array.isArray(profiles) ? profiles : profiles ? [profiles] : [];
    })
    .map((profile) => mapProfile(profile as unknown as Record<string, unknown>));
}

async function getProfileById(profileId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    logNotificationDataError("Failed to load notification profile", error);
    return null;
  }

  return data ? mapProfile(data) : null;
}

async function getProfileByClerkUserId(clerkUserId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    logNotificationDataError("Failed to load notification profile", error);
    return null;
  }

  return data ? mapProfile(data) : null;
}

async function getNotificationRecipient(
  profileId: unknown,
  clerkUserId: unknown,
): Promise<Profile | null> {
  if (typeof profileId === "string" && profileId) {
    const profile = await getProfileById(profileId);
    if (profile) return profile;
  }

  return typeof clerkUserId === "string" && clerkUserId
    ? getProfileByClerkUserId(clerkUserId)
    : null;
}

function notificationHrefForBoard(board: Board, postId: string | null) {
  const base =
    board.boardType === "official_event"
      ? `/events/${board.slug}/board`
      : `/boards/${board.id}`;
  return postId ? `${base}#memory-${postId}` : base;
}

function isFriendVisibleBoard(board: Board) {
  if (board.boardType === "official_event") {
    return board.visibility === "public" && board.verificationStatus === "verified";
  }

  return board.sharingScope === "followers" || board.sharingScope === "public";
}

function uniqueProfiles(profiles: Profile[]) {
  return Array.from(new Map(profiles.map((profile) => [profile.id, profile])).values());
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function toNotificationType(value: unknown): NotificationType {
  return NOTIFICATION_TYPES.includes(value as NotificationType)
    ? (value as NotificationType)
    : "followed_you";
}

function isDuplicateNotificationError(error: unknown) {
  return (error as { code?: string } | null)?.code === "23505";
}

function displayName(profile: Profile) {
  return profile.displayName ?? profile.email ?? "An Evespace user";
}

let hasWarnedAboutMissingNotificationsSchema = false;

function logNotificationDataError(message: string, error: unknown) {
  const next = error as { code?: string; message?: string } | null;

  if (
    next?.code === "PGRST205" ||
    next?.message?.includes("Could not find the table 'public.notifications'") ||
    next?.message?.includes("Could not find the table 'public.user_follow_requests'")
  ) {
    if (!hasWarnedAboutMissingNotificationsSchema) {
      hasWarnedAboutMissingNotificationsSchema = true;
      console.warn(
        "Evespace notifications schema is not available yet. Run supabase/migrations/0004_notifications.sql and supabase/migrations/0009_notification_revamp.sql in Supabase, then refresh the app.",
      );
    }

    return;
  }

  console.warn(message, error);
}
