import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupNotificationsByDay } from "./notification-utils.js";

const baseNotification = {
  id: "notification-1",
  recipientProfileId: "profile-1",
  recipientClerkUserId: "user-1",
  actorProfileId: null,
  actorClerkUserId: null,
  actorDisplayName: null,
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
  createdAt: "2026-05-11T14:00:00.000Z",
};

describe("notification utilities", () => {
  it("groups notifications created today separately from earlier notifications", () => {
    const groups = groupNotificationsByDay(
      [
        {
          ...baseNotification,
          id: "today",
          createdAt: "2026-05-11T14:00:00.000Z",
        },
        {
          ...baseNotification,
          id: "earlier",
          createdAt: "2026-05-10T23:59:59.000Z",
        },
      ],
      new Date("2026-05-11T18:00:00.000Z"),
    );

    assert.deepEqual(
      groups.today.map((notification) => notification.id),
      ["today"],
    );
    assert.deepEqual(
      groups.earlier.map((notification) => notification.id),
      ["earlier"],
    );
  });
});
