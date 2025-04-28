import { useState, useEffect } from 'react';
import { CalendarEvent, User } from '../types';
import { checkPendingTransfers } from '../services/calendar';

export const useNotificationSystem = (currentUser: User | null) => {
  const [notifications, setNotifications] = useState<CalendarEvent[]>([]);
  const [currentNotification, setCurrentNotification] = useState<CalendarEvent | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const checkForNotifications = async () => {
      try {
        const transfers = await checkPendingTransfers(currentUser.id);
        if (transfers.length > 0) {
          setNotifications(transfers);
          setCurrentNotification(transfers[0]);
          setShowNotification(true);
        }
      } catch (error) {
        console.error('Failed to check notifications:', error);
      }
    };

    checkForNotifications();
    const interval = setInterval(checkForNotifications, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const dismissNotification = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };

  const refreshNotifications = async () => {
    if (!currentUser) return;
    try {
      const transfers = await checkPendingTransfers(currentUser.id);
      setNotifications(transfers);
      setCurrentNotification(transfers[0] || null);
      setShowNotification(transfers.length > 0);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  return {
    notifications,
    currentNotification,
    showNotification,
    dismissNotification,
    refreshNotifications,
    notificationCount: notifications.length
  };
};