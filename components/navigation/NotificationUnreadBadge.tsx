"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  notificationsChangedEvent,
  notificationsReadEvent,
} from "@/lib/notifications/events";

export function NotificationUnreadBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) return;

      const payload = (await response.json()) as { count?: unknown };
      if (typeof payload.count === "number") {
        setCount(Math.max(0, payload.count));
      }
    } catch {
      // Preserve the last known count during a transient network failure.
    }
  }, []);

  useEffect(() => {
    const initialRefreshId = window.setTimeout(() => void refresh(), 0);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);

    function handleFocus() {
      void refresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void refresh();
    }

    function handleRead() {
      setCount(0);
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener(notificationsChangedEvent, handleFocus);
    window.addEventListener(notificationsReadEvent, handleRead);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(notificationsChangedEvent, handleFocus);
      window.removeEventListener(notificationsReadEvent, handleRead);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, refresh]);

  if (count === 0) return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 flex min-w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-rose-500 px-1 text-[0.62rem] font-black leading-4 text-white shadow-sm"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
