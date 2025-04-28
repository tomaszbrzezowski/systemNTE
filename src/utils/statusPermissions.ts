import { UserRole, EventStatus, User } from '../types';

export const getAvailableStatuses = (userRole: UserRole | undefined, currentStatus?: EventStatus): EventStatus[] => {
  if (!userRole) return [];

  // Administrators get access to all statuses
  if (userRole === 'administrator') {
    return [
      'wydany',
      'wolne',
      'w_trakcie',
      'zrobiony',
      'do_przejęcia',
      'niewydany',
      'przekaz',
      'przekazywany',
      'przekazany'
    ];
  }

  // Other roles get limited status access
  const statusesByRole: Record<UserRole, EventStatus[]> = {
    administrator: [
      'wydany', 'wolne', 'w_trakcie', 'zrobiony', 'do_przejęcia', 
      'niewydany', 'przekaz', 'przekazywany', 'przekazany'
    ],
    supervisor: [
      'wydany', 'w_trakcie', 'zrobiony', 'przekaz', 'do_przejęcia'
    ],
    organizator: [
      'wydany', 'w_trakcie', 'zrobiony', 'przekaz', 'do_przejęcia'
    ]
  };

  return statusesByRole[userRole] || [];
};

export const canEditEvent = (
  currentUser: User | null,
  eventStatus?: EventStatus,
  eventUserId?: string | null
): boolean => {
  if (!currentUser) return false;

  // Administrators can edit any event regardless of status or owner
  if (currentUser.role === 'administrator') {
    return true;
  }

  // Anyone can take over events marked as do_przejęcia
  if (eventStatus === 'do_przejęcia') {
    return true;
  }

  // Prevent editing events that are being transferred
  if (eventStatus === 'przekazywany') {
    return false;
  }

  const isOwnEvent = currentUser.id === eventUserId;
  const isSupervisorOrganizer = currentUser.role === 'supervisor' && 
    eventUserId && currentUser.organizatorIds.includes(eventUserId);

  // For other roles, apply normal restrictions
  if (eventStatus === 'niewydany' || eventStatus === 'wolne') {
    return false;
  }

  if (eventStatus === 'zrobiony' && !isOwnEvent) {
    return false;
  }

  if (currentUser.role === 'supervisor') {
    return isOwnEvent || isSupervisorOrganizer;
  }

  if (currentUser.role === 'organizator') {
    return isOwnEvent;
  }

  return false;
};