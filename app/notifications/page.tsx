import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile";
import { getNotificationsForProfile } from "@/lib/data/notifications";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const profile = await ensureUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const notifications = await getNotificationsForProfile(profile);

  return (
    <main className="cosmic-bg min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto grid max-w-3xl gap-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-100">
            Notifications
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Your Updates
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            See when you follow someone or when someone follows you.
          </p>
        </header>

        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet."
            description="Follow another user, or wait for someone to follow you."
          />
        ) : (
          <div className="grid gap-3">
            {notifications.map((notification) => {
              const content = (
                <Card className="transition hover:border-cyan-200/30 hover:bg-white/[0.08]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">
                        {notification.title}
                      </p>
                      {notification.body ? (
                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {notification.body}
                        </p>
                      ) : null}
                    </div>
                    <time className="shrink-0 text-xs text-slate-500">
                      {formatDate(notification.createdAt)}
                    </time>
                  </div>
                </Card>
              );

              return notification.href ? (
                <Link href={notification.href} key={notification.id}>
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
