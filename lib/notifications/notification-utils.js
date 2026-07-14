function groupNotificationsByDay(notifications, now = new Date()) {
  const todayKey = dayKey(now);
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);

  return notifications.reduce(
    (groups, notification) => {
      const createdAt = new Date(notification.createdAt);
      const createdKey = dayKey(createdAt);
      if (createdKey === todayKey) {
        groups.today.push(notification);
      } else if (createdAt >= weekStart) {
        groups.thisWeek.push(notification);
      } else {
        groups.earlier.push(notification);
      }
      return groups;
    },
    { today: [], thisWeek: [], earlier: [] },
  );
}

function formatRelativeNotificationTime(value, now = new Date()) {
  const createdAt = new Date(value);
  const seconds = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 1000));

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

exports.groupNotificationsByDay = groupNotificationsByDay;
exports.formatRelativeNotificationTime = formatRelativeNotificationTime;
