export function groupNotificationsByDay<T extends { createdAt: string }>(
  notifications: T[],
  now?: Date,
): {
  today: T[];
  thisWeek: T[];
  earlier: T[];
};

export function formatRelativeNotificationTime(value: string, now?: Date): string;
