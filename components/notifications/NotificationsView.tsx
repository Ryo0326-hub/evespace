import Image from "next/image";
import Link from "next/link";
import {
  acceptFollowRequestAction,
  denyFollowRequestAction,
} from "@/app/actions/follows";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationReadTracker } from "@/components/notifications/NotificationReadTracker";
import {
  formatRelativeNotificationTime,
  groupNotificationsByDay,
} from "@/lib/notifications/notification-utils";
import type { AppNotification } from "@/types/evespace";

export function NotificationsView({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const groups = groupNotificationsByDay(notifications);

  return (
    <div className="min-w-0">
      <NotificationReadTracker
        hasUnread={notifications.some((notification) => !notification.readAt)}
      />
      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet."
          description="Your updates will appear here as they happen."
        />
      ) : (
        <div className="grid gap-7">
          <NotificationSection notifications={groups.today} title="Today" />
          <NotificationSection notifications={groups.thisWeek} title="This week" />
          <NotificationSection notifications={groups.earlier} title="Earlier" />
        </div>
      )}
    </div>
  );
}

function NotificationSection({
  notifications,
  title,
}: {
  notifications: AppNotification[];
  title: string;
}) {
  if (notifications.length === 0) return null;

  return (
    <section aria-labelledby={`notifications-${title.toLowerCase().replaceAll(" ", "-")}`}>
      <h2
        className="mb-2 px-2 text-sm font-bold text-white"
        id={`notifications-${title.toLowerCase().replaceAll(" ", "-")}`}
      >
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/38">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
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
  const row = (
    <article
      className={`relative flex min-w-0 items-center gap-3 border-b border-white/8 px-3 py-3.5 transition last:border-b-0 sm:px-4 ${
        notification.readAt
          ? "hover:bg-white/[0.045]"
          : "bg-cyan-300/[0.075] hover:bg-cyan-300/[0.11]"
      }`}
    >
      {!notification.readAt ? (
        <span
          aria-label="Unread"
          className="absolute left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-cyan-300"
        />
      ) : null}
      <NotificationAvatar notification={notification} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 text-slate-200">
          <NotificationSentence notification={notification} />{" "}
          <time className="whitespace-nowrap text-xs text-slate-500">
            {formatRelativeNotificationTime(notification.createdAt)}
          </time>
        </p>
        {notification.notificationType === "follow_requested" &&
        notification.followRequestStatus &&
        notification.followRequestStatus !== "pending" ? (
          <p className="mt-1 text-xs font-semibold capitalize text-slate-500">
            {notification.followRequestStatus}
          </p>
        ) : null}
        {canRespond && followRequestId ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <form action={acceptFollowRequestAction}>
              <input name="requestId" type="hidden" value={followRequestId} />
              <input name="returnPath" type="hidden" value="/notifications" />
              <Button className="min-h-8 px-3 py-1 text-xs" type="submit">
                Accept
              </Button>
            </form>
            <form action={denyFollowRequestAction}>
              <input name="requestId" type="hidden" value={followRequestId} />
              <input name="returnPath" type="hidden" value="/notifications" />
              <Button
                className="min-h-8 px-3 py-1 text-xs"
                type="submit"
                variant="secondary"
              >
                Deny
              </Button>
            </form>
          </div>
        ) : null}
      </div>
      {notification.targetImageUrl ? (
        <Image
          alt="Memory preview"
          className="size-12 shrink-0 rounded-lg border border-white/10 object-cover sm:size-14"
          height={56}
          src={notification.targetImageUrl}
          unoptimized
          width={56}
        />
      ) : null}
    </article>
  );

  return notification.href && !canRespond ? (
    <Link className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200" href={notification.href}>
      {row}
    </Link>
  ) : (
    row
  );
}

function NotificationAvatar({ notification }: { notification: AppNotification }) {
  const name = notification.actorDisplayName ?? "Evespace";

  return notification.actorAvatarUrl ? (
    <Image
      alt={`${name} avatar`}
      className="size-11 shrink-0 rounded-full border border-white/15 object-cover"
      height={44}
      src={notification.actorAvatarUrl}
      unoptimized
      width={44}
    />
  ) : (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-cyan-100/20 bg-cyan-100/10 text-xs font-black text-cyan-100">
      {getInitials(name)}
    </span>
  );
}

function NotificationSentence({ notification }: { notification: AppNotification }) {
  const actorName = notification.actorDisplayName;
  const body = notification.body ?? notification.title;

  if (notification.notificationType === "follow_request_sent" && actorName) {
    return (
      <>
        Follow request sent to <strong className="font-semibold text-white">{actorName}</strong>.
      </>
    );
  }

  if (actorName && body.startsWith(actorName)) {
    return (
      <>
        <strong className="font-semibold text-white">{actorName}</strong>
        {body.slice(actorName.length)}
      </>
    );
  }

  return <>{body}</>;
}

function getInitials(value: string) {
  return (
    value
      .split(/[ @._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "EV"
  );
}
