// Local storage key for seen notifications
const SEEN_NOTIFICATIONS_KEY = 'seen_notifications';

// Get array of seen notification IDs from local storage
export const getSeenNotifications = (): string[] => {
  const stored = localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Mark a notification as seen by storing its ID
export const markNotificationAsSeen = (notificationId: string): void => {
  const seenNotifications = getSeenNotifications();
  if (!seenNotifications.includes(notificationId)) {
    seenNotifications.push(notificationId);
    localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify(seenNotifications));
  }
};

// Clear all seen notifications (useful for testing/debugging)
export const clearSeenNotifications = (): void => {
  localStorage.removeItem(SEEN_NOTIFICATIONS_KEY);
};