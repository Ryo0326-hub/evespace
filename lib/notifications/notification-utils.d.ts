export function groupNotificationsByDay<T extends { createdAt: string }>(
  notifications: T[],
  now?: Date,
): {
  today: T[];
  earlier: T[];
};
