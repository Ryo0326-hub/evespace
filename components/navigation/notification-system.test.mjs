import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const panelFiles = [
  "app/@explorePanel/default.tsx",
  "app/@explorePanel/[...catchAll]/page.tsx",
  "app/@explorePanel/(.)explore/page.tsx",
  "app/@explorePanel/(.)explore/loading.tsx",
  "app/@notificationsPanel/default.tsx",
  "app/@notificationsPanel/[...catchAll]/page.tsx",
  "app/@notificationsPanel/(.)notifications/page.tsx",
  "app/@notificationsPanel/(.)notifications/loading.tsx",
];

describe("notification system expansion", () => {
  it("adds all planned notification types and an unread index", async () => {
    const [typesSource, migrationSource] = await Promise.all([
      readFile("types/evespace.ts", "utf8"),
      readFile("supabase/migrations/0021_notification_expansion.sql", "utf8"),
    ]);
    const notificationTypes = [
      "follow_request_sent",
      "follow_request_accepted",
      "memory_post_commented",
      "comment_replied",
      "memory_post_moderated",
      "event_verification_updated",
    ];

    for (const type of notificationTypes) {
      assert.match(typesSource, new RegExp(`"${type}"`));
      assert.match(migrationSource, new RegExp(`'${type}'`));
    }
    assert.match(migrationSource, /where read_at is null/i);
    assert.match(typesSource, /actorAvatarUrl: string \| null/);
    assert.match(typesSource, /targetImageUrl: string \| null/);
  });

  it("wires social, memory, moderation, and verification actions", async () => {
    const [follows, memories, admin, notifications] = await Promise.all([
      readFile("app/actions/follows.ts", "utf8"),
      readFile("app/actions/memories.ts", "utf8"),
      readFile("app/actions/admin.ts", "utf8"),
      readFile("lib/data/notifications.ts", "utf8"),
    ]);

    assert.match(follows, /createFollowRequestedNotification/);
    assert.match(follows, /createFollowNotifications\(\{[\s\S]*acceptedAt/);
    assert.match(memories, /createMemoryCommentNotifications/);
    assert.match(memories, /createMemoryPostModeratedNotification/);
    assert.match(admin, /createEventVerificationNotification/);
    assert.match(notifications, /recipient\.id !== actor\.id/);
    assert.match(notifications, /comment_replied:\$\{commentId\}:\$\{parentAuthor\.id\}/);
  });

  it("provides intercepted panels while preserving direct pages", async () => {
    for (const file of panelFiles) {
      await assert.doesNotReject(access(file, constants.R_OK), `${file} should exist`);
    }

    const [layout, nav, notificationsPage, explorePage, panel, globals] = await Promise.all([
      readFile("app/layout.tsx", "utf8"),
      readFile("components/navigation/AppNav.tsx", "utf8"),
      readFile("app/notifications/page.tsx", "utf8"),
      readFile("app/explore/page.tsx", "utf8"),
      readFile("components/navigation/NavPanel.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);

    assert.match(layout, /explorePanel: React\.ReactNode/);
    assert.match(layout, /notificationsPanel: React\.ReactNode/);
    assert.match(nav, /\{explorePanel\}/);
    assert.match(nav, /\{notificationsPanel\}/);
    assert.match(notificationsPage, /NotificationsView/);
    assert.match(explorePage, /ExploreView/);
    assert.match(panel, /role="dialog"/);
    assert.match(panel, /aria-modal="true"/);
    assert.match(panel, /createPortal/);
    assert.match(panel, /hydrated \? document\.body : null/);
    assert.match(panel, /h-\[100dvh\]/);
    assert.doesNotMatch(panel, /md:absolute/);
    assert.match(nav, /data-nav-panel-anchor="explore"/);
    assert.match(nav, /data-nav-panel-anchor="notifications"/);
    assert.match(globals, /env\(safe-area-inset-bottom\)/);
    assert.match(globals, /prefers-reduced-motion: reduce[\s\S]*\.nav-panel/);
  });

  it("shows the responsive panel shell while intercepted routes load", async () => {
    const [exploreLoading, notificationsLoading, loadingState] = await Promise.all([
      readFile("app/@explorePanel/(.)explore/loading.tsx", "utf8"),
      readFile("app/@notificationsPanel/(.)notifications/loading.tsx", "utf8"),
      readFile("components/navigation/NavPanelLoading.tsx", "utf8"),
    ]);

    assert.match(exploreLoading, /<NavPanel side="explore" title="Explore">/);
    assert.match(notificationsLoading, /<NavPanel side="notifications" title="Notifications">/);
    assert.match(exploreLoading, /<NavPanelLoading \/>/);
    assert.match(notificationsLoading, /<NavPanelLoading \/>/);
    assert.match(loadingState, /role="status"/);
    assert.match(loadingState, /aria-live="polite"/);
    assert.match(loadingState, /className="loading-hourglass/);
    assert.match(loadingState, /<span>Loading\.\.<\/span>/);
    assert.match(loadingState, /h-full min-h-\[18rem\]/);
  });

  it("polls an authenticated no-store unread count and clears it on read", async () => {
    const [route, badge, tracker] = await Promise.all([
      readFile("app/api/notifications/unread-count/route.ts", "utf8"),
      readFile("components/navigation/NotificationUnreadBadge.tsx", "utf8"),
      readFile("components/notifications/NotificationReadTracker.tsx", "utf8"),
    ]);

    assert.match(route, /await auth\(\)/);
    assert.match(route, /status: 401/);
    assert.match(route, /Cache-Control": "no-store"/);
    assert.match(badge, /30_000/);
    assert.match(badge, /count > 99 \? "99\+"/);
    assert.match(tracker, /markNotificationsReadAction/);
  });
});
