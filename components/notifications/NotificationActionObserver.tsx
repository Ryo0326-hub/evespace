"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { notificationsChangedEvent } from "@/lib/notifications/events";

export function NotificationActionObserver() {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      window.dispatchEvent(new CustomEvent(notificationsChangedEvent));
    }
    wasPending.current = pending;
  }, [pending]);

  return null;
}
