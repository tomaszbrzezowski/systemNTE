import { User, EventStatus } from '../types';

export const canEditEvent = (
  currentUser: User | null,
  eventStatus?: EventStatus,
  eventUserId?: string | null
): boolean => {
  if (!currentUser) return false;

  }
  // Administrators can edit any event
  if (currentUser.role === 'administrator') {
    return true;
  }

  // Only administrators can edit niewydany or wolne status
  if (eventStatus === 'niewydany' || eventStatus === 'wolne') {
    return false;
  }

  // Anyone can take over events marked as do_przejęcia
  if (eventStatus === 'do_przejęcia') {
    return true;
  }

  // For supervisors, check if they own the event or if it belongs to their organizers
  if (currentUser.role === 'supervisor') {
    const isOwnEvent = currentUser.id === eventUserId;
    const isOrganizersEvent = eventUserId && currentUser.organizatorIds.includes(eventUserId);
    
    return (isOwnEvent || isOrganizersEvent) && 
           eventStatus !== 'zrobiony' &&
           eventStatus !== 'wolne' &&
           eventStatus !== 'niewydany';
  }

  // For organizers, they can only edit their own events
  if (currentUser.role === 'organizator') {
    return currentUser.id === eventUserId &&
           eventStatus !== 'zrobiony' &&
           eventStatus !== 'wolne' &&
           eventStatus !== 'niewydany';
  }

  return false;
};

export const canTransferEvent = (
  userRole: string,
  eventStatus?: EventStatus,
  isOwner: boolean
): boolean => {
  // Administrators can transfer any event
  if (userRole === 'administrator') {
    return true;
  }

  // Only owners can transfer their events
  if (!isOwner) {
    return false;
  }

  // Can't transfer completed or already transferred events
  return eventStatus !== 'zrobiony' && 
         eventStatus !== 'przekazany' && 
         eventStatus !== 'przekaz';
};