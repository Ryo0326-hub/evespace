import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatRelativeNotificationTime,
  groupNotificationsByDay,
} from "./notification-utils.js";

const baseNotification = {
  id: "notification-1",
  recipientProfileId: "profile-1",
  recipientClerkUserId: "user-1",
  actorProfileId: null,
  actorClerkUserId: null,
  actorDisplayName: null,
  actorAvatarUrl: null,
  notificationType: "board_created",
  title: "Board created",
  body: null,
  href: null,
  metadata: {},
  readAt: null,
  important: false,
  emailSentAt: null,
  emailError: null,
  followRequestStatus: null,
  targetImageUrl: null,
  createdAt: "2026-05-11T14:00:00.000Z",
};

describe("notification utilities", () => {
  it("groups notifications into today, this week, and earlier", () => {
    const groups = groupNotificationsByDay(
      [
        {
          ...baseNotification,
          id: "today",
          createdAt: new Date(2026, 4, 11, 14).toISOString(),
        },
        {
          ...baseNotification,
          id: "this-week",
          createdAt: new Date(2026, 4, 10, 23, 59, 59).toISOString(),
        },
        {
          ...baseNotification,
          id: "earlier",
          createdAt: new Date(2026, 4, 1, 12).toISOString(),
        },
      ],
      new Date(2026, 4, 11, 18),
    );

    assert.deepEqual(
      groups.today.map((notification) => notification.id),
      ["today"],
    );
    assert.deepEqual(
      groups.thisWeek.map((notification) => notification.id),
      ["this-week"],
    );
    assert.deepEqual(
      groups.earlier.map((notification) => notification.id),
      ["earlier"],
    );
  });

  it("formats compact Instagram-style relative times", () => {
    const now = new Date("2026-05-11T18:00:00.000Z");

    assert.equal(formatRelativeNotificationTime("2026-05-11T17:59:40.000Z", now), "now");
    assert.equal(formatRelativeNotificationTime("2026-05-11T17:48:00.000Z", now), "12m");
    assert.equal(formatRelativeNotificationTime("2026-05-11T15:00:00.000Z", now), "3h");
    assert.equal(formatRelativeNotificationTime("2026-05-09T18:00:00.000Z", now), "2d");
  });
});
