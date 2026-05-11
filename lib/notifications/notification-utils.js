function groupNotificationsByDay(notifications, now = new Date()) {
  const todayKey = dayKey(now);

  return notifications.reduce(
    (groups, notification) => {
      const createdKey = dayKey(new Date(notification.createdAt));
      if (createdKey === todayKey) {
        groups.today.push(notification);
      } else {
        groups.earlier.push(notification);
      }
      return groups;
    },
    { today: [], earlier: [] },
  );
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

exports.groupNotificationsByDay = groupNotificationsByDay;
