import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, User } from '../types';
import { checkPendingTransfers, acceptTransfer, rejectTransfer, getCalendars } from '../services/calendar';
import { getSeenNotifications, markNotificationAsSeen } from '../utils/notificationStorage';

export const useTransferNotifications = (currentUser: User | null) => {
  const [showNotification, setShowNotification] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState<CalendarEvent | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [pendingTransfers, setPendingTransfers] = useState<CalendarEvent[]>([]);

  const checkForTransfers = useCallback(async () => {
    if (!currentUser) return;
    
    let transfers: CalendarEvent[] = [];
    try {
      transfers = await checkPendingTransfers(currentUser.id);
      
      // Filter out any transfers that are no longer in the correct status
      const validTransfers = transfers.filter(transfer => 
        transfer.status === 'przekazywany' || transfer.status === 'do_przejęcia'
      );
      
      // Get list of seen notification IDs
      const seenNotifications = getSeenNotifications();
      
      // Filter out seen notifications
      const unseenTransfers = validTransfers.filter(transfer => 
        !seenNotifications.includes(transfer.id)
      );
      
      setPendingTransfers(validTransfers);
      setNotificationCount(validTransfers.length);
      setCurrentTransfer(unseenTransfers.length > 0 ? unseenTransfers[0] : null);
      
      // Show notification if there are unseen transfers
      if (unseenTransfers.length > 0) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Failed to check pending transfers:', error);
      // Don't update state on error to preserve existing data
      return;
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    
    const handleLoginNotification = () => {
      setShowNotification(true);
    };

    const handleClearNotification = (event: CustomEvent<string>) => {
      const eventId = event.detail;
      // Mark notification as seen when cleared
      markNotificationAsSeen(eventId);
      setPendingTransfers(prev => prev.filter(transfer => transfer.id !== eventId));
      setNotificationCount(prev => Math.max(0, prev - 1));
      setCurrentTransfer(prev => prev?.id === eventId ? null : prev);
      setShowNotification(false);
    };

    window.addEventListener('clearNotification', handleClearNotification as EventListener);
    window.addEventListener('showLoginNotification', handleLoginNotification);
    checkForTransfers();
    const interval = setInterval(checkForTransfers, 30000);
    
    return () => {
      window.removeEventListener('showLoginNotification', handleLoginNotification);
      window.removeEventListener('clearNotification', handleClearNotification as EventListener);
      clearInterval(interval);
    };
  }, [currentUser, checkForTransfers]);

  const refreshTransfers = async () => {
    if (!currentUser) return;
    try {
      const transfers = await checkPendingTransfers(currentUser.id);
      const validTransfers = transfers.filter(transfer => 
        transfer.status === 'przekazywany' || transfer.status === 'do_przejęcia'
      );
      
      setPendingTransfers(validTransfers);
      setNotificationCount(validTransfers.length);
      if (validTransfers.length > 0) {
        setCurrentTransfer(validTransfers[0]);
      } else {
        setCurrentTransfer(null);
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Failed to refresh transfers:', error);
    }
  };

  const handleAcceptTransfer = async (event: CalendarEvent) => {
    try {
      // Dispatch event to clear notification
      window.dispatchEvent(new CustomEvent('clearNotification', { detail: event.id }));

      await acceptTransfer(event.id);
      await getCalendars();
      await refreshTransfers();
    } catch (error) {
      console.error('Failed to accept transfer:', error);
    }
  };

  const handleRejectTransfer = async (event: CalendarEvent) => {
    try {
      // Dispatch event to clear notification
      window.dispatchEvent(new CustomEvent('clearNotification', { detail: event.id }));

      await rejectTransfer(event.id);
      await refreshTransfers();
      await getCalendars();
    } catch (error) {
      console.error('Failed to reject transfer:', error);
    }
  };

  return {
    pendingTransfers,
    showNotification,
    currentTransfer,
    setShowNotification,
    notificationCount,
    handleAcceptTransfer,
    handleRejectTransfer,
    refreshTransfers
  };
};