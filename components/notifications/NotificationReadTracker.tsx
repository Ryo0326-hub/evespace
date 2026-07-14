"use client";

import { useEffect } from "react";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { notificationsReadEvent } from "@/lib/notifications/events";

export function NotificationReadTracker({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (!hasUnread) return;

    void markNotificationsReadAction().then((result) => {
      if (result.ok) {
        window.dispatchEvent(new CustomEvent(notificationsReadEvent));
      }
    });
  }, [hasUnread]);

  return null;
}
