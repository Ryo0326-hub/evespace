import Link from "next/link";
import { redirect } from "next/navigation";
import {
  acceptFollowRequestAction,
  denyFollowRequestAction,
} from "@/app/actions/follows";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getNotificationsForProfile } from "@/lib/data/notifications";
import { groupNotificationsByDay } from "@/lib/notifications/notification-utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { AppNotification } from "@/types/evespace";

export default async function NotificationsPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const notifications = await getNotificationsForProfile(profile);
  const groupedNotifications = groupNotificationsByDay(notifications);

  return (
    <main className="cosmic-bg evespace-page">
      <div className="evespace-shell max-w-3xl">
        <header className="evespace-page-header">
          <p className="evespace-kicker">
            Notifications
          </p>
          <h1 className="evespace-page-title">
            Latest updates
          </h1>
        </header>

        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet."
            description="Your updates will appear here as they happen."
          />
        ) : (
          <div className="grid gap-7">
            <NotificationSection
              notifications={groupedNotifications.today}
              title="Today"
            />
            <NotificationSection
              notifications={groupedNotifications.earlier}
              title="Earlier"
            />
          </div>
        )}
      </div>
    </main>
  );
}

function NotificationSection({
  notifications,
  title,
}: {
  notifications: AppNotification[];
  title: string;
}) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <section className="evespace-section">
      <h2 className="evespace-subsection-title">{title}</h2>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </section>
  );
}

function NotificationItem({ notification }: { notification: AppNotification }) {
  const followRequestId =
    typeof notification.metadata.followRequestId === "string"
      ? notification.metadata.followRequestId
      : null;
  const canRespond =
    notification.notificationType === "follow_requested" &&
    notification.followRequestStatus === "pending" &&
    Boolean(followRequestId);

  const content = (
    <Card className="transition hover:border-cyan-200/30 hover:bg-white/[0.08]">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-base font-semibold text-white">
            {notification.title}
          </p>
          {notification.body ? (
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {notification.body}
            </p>
          ) : null}
          {notification.notificationType === "follow_requested" &&
          notification.followRequestStatus &&
          notification.followRequestStatus !== "pending" ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {notification.followRequestStatus}
            </p>
          ) : null}
        </div>
        <time className="shrink-0 text-xs text-slate-500">
          {formatDate(notification.createdAt)}
        </time>
      </div>
      {canRespond && followRequestId ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={acceptFollowRequestAction}>
            <input name="requestId" type="hidden" value={followRequestId} />
            <input name="returnPath" type="hidden" value="/notifications" />
            <Button type="submit">Accept</Button>
          </form>
          <form action={denyFollowRequestAction}>
            <input name="requestId" type="hidden" value={followRequestId} />
            <input name="returnPath" type="hidden" value="/notifications" />
            <Button type="submit" variant="secondary">
              Deny
            </Button>
          </form>
        </div>
      ) : null}
    </Card>
  );

  return notification.href && !canRespond ? (
    <Link href={notification.href}>{content}</Link>
  ) : (
    content
  );
}
