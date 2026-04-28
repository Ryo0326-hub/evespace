import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppNotification, Profile } from "@/types/evespace";

const NOTIFICATION_SELECT =
  "*, actor:actor_profile_id(display_name, email, clerk_user_id)";

type NotificationActor = {
  display_name?: string | null;
  email?: string | null;
  clerk_user_id?: string | null;
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

  return data.map(mapNotification);
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
  const { error } = await supabase.from("notifications").insert([
    {
      recipient_profile_id: following.id,
      recipient_clerk_user_id: following.clerkUserId,
      actor_profile_id: follower.id,
      actor_clerk_user_id: follower.clerkUserId,
      notification_type: "followed_you",
      title: "New follower",
      body: `${followerName} followed you.`,
      href: "/dashboard/friends",
      metadata: {
        followerProfileId: follower.id,
      },
    },
    {
      recipient_profile_id: follower.id,
      recipient_clerk_user_id: follower.clerkUserId,
      actor_profile_id: following.id,
      actor_clerk_user_id: following.clerkUserId,
      notification_type: "you_followed",
      title: "You followed someone",
      body: `You followed ${followingName}.`,
      href: "/dashboard/friends",
      metadata: {
        followingProfileId: following.id,
      },
    },
  ]);

  if (error) {
    logNotificationDataError("Failed to create follow notifications", error);
  }
}

function mapNotification(row: Record<string, unknown>): AppNotification {
  const actor = Array.isArray(row.actor)
    ? (row.actor[0] as NotificationActor | undefined)
    : (row.actor as NotificationActor | undefined);

  return {
    id: String(row.id),
    recipientProfileId: (row.recipient_profile_id as string | null) ?? null,
    recipientClerkUserId: String(row.recipient_clerk_user_id),
    actorProfileId: (row.actor_profile_id as string | null) ?? null,
    actorClerkUserId: (row.actor_clerk_user_id as string | null) ?? null,
    actorDisplayName: actor ? actor.display_name ?? actor.email ?? null : null,
    notificationType:
      row.notification_type === "you_followed" ? "you_followed" : "followed_you",
    title: String(row.title),
    body: (row.body as string | null) ?? null,
    href: (row.href as string | null) ?? null,
    readAt: (row.read_at as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

function displayName(profile: Profile) {
  return profile.displayName ?? profile.email ?? "An Evespace user";
}

let hasWarnedAboutMissingNotificationsSchema = false;

function logNotificationDataError(message: string, error: unknown) {
  const next = error as { code?: string; message?: string } | null;

  if (
    next?.code === "PGRST205" ||
    next?.message?.includes("Could not find the table 'public.notifications'")
  ) {
    if (!hasWarnedAboutMissingNotificationsSchema) {
      hasWarnedAboutMissingNotificationsSchema = true;
      console.warn(
        "Evespace notifications schema is not available yet. Run supabase/migrations/0004_notifications.sql in Supabase, then refresh the app.",
      );
    }

    return;
  }

  console.warn(message, error);
}
