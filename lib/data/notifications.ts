import "server-only";

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
  "*, actor:actor_profile_id(display_name, email, clerk_user_id)";

const NOTIFICATION_TYPES: NotificationType[] = [
  "followed_you",
  "you_followed",
  "follow_requested",
  "memory_post_added",
  "board_created",
  "planet_level_up",
  "friend_board_created",
];

type NotificationActor = {
  display_name?: string | null;
  email?: string | null;
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

  const notifications = data.map(mapNotification);
  return hydrateFollowRequestStatuses(notifications);
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
    dedupeKey: `follow_requested:${request.id}`,
    important: true,
  });

  if (!notification || notification.emailSentAt) {
    return;
  }

  const result = await sendFollowRequestEmail({ recipient: requested, requester });
  await updateNotificationEmailResult(notification.id, result);
}

export async function createFollowNotifications({
  follower,
  following,
}: {
  follower: Profile;
  following: Profile;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  const followerName = displayName(follower);
  const followingName = displayName(following);
  await createNotifications([
    {
      recipient: following,
      actor: follower,
      notificationType: "followed_you",
      title: "New follower",
      body: `${followerName} followed you.`,
      href: "/dashboard/friends",
      metadata: {
        followerProfileId: follower.id,
      },
      dedupeKey: `followed_you:${follower.id}:${following.id}`,
    },
    {
      recipient: follower,
      actor: following,
      notificationType: "you_followed",
      title: "You followed someone",
      body: `You followed ${followingName}.`,
      href: "/dashboard/friends",
      metadata: {
        followingProfileId: following.id,
      },
      dedupeKey: `you_followed:${follower.id}:${following.id}`,
    },
  ]);
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
      href:
        board.boardType === "official_event"
          ? `/events/${board.slug}/board`
          : `/boards/${board.id}`,
      metadata: {
        boardId: board.id,
        postId,
      },
      dedupeKey: `memory_post_added:${postId}:${recipient.id}`,
    })),
  );
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
    createdAt: String(row.created_at),
  };
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
