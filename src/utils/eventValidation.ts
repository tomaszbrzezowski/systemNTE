import { CalendarEvent } from '../types';

export const validateEventUpdate = (
  eventData: Partial<CalendarEvent>,
  isAdmin: boolean = false
): boolean => {
  // Administrators can make any changes
  if (isAdmin) return true;

  // For przekaz status, only toUserId is required
  if (eventData.status === 'przekaz') {
    return !!eventData.toUserId;
  }

  // For wolne status, ensure no user is assigned
  if (eventData.status === 'wolne') {
    if (eventData.userId || eventData.city || eventData.previousUserId || eventData.toUserId) {
      return false;
    }
    return true;
  }

  // For przekazywany status, ensure we have required fields
  if (eventData.status === 'przekazywany') {
    if (!eventData.userId || !eventData.toUserId || eventData.userId === eventData.toUserId) {
      return false;
    }
    return true;
  }

  // For przekazany status, ensure we have required fields
  if (eventData.status === 'przekazany') {
    if (!eventData.userId || (!eventData.previousUserId && eventData.status !== 'do_przejęcia')) {
      return false;
    }
    return true;
  }

  // For niewydany status, ensure no user is assigned
  if (eventData.status === 'niewydany') {
    if (eventData.userId || eventData.city || eventData.previousUserId || eventData.toUserId) {
      return false;
    }
    return true;
  }

  return true;
};

export const cleanEventDataForStatus = (
  eventData: Partial<CalendarEvent>,
  isAdmin: boolean = false
): Partial<CalendarEvent> => {
  // Administrators can override cleaning rules
  if (isAdmin) return eventData;

  const cleanedData = { ...eventData };

  // For przekaz status, only keep toUserId
  if (cleanedData.status === 'przekaz') {
    cleanedData.city = null;
    return cleanedData;
  }

  // Clear city when status is set to wydany
  if (cleanedData.status === 'wydany') {
    cleanedData.city = null;
  }

  // Clear all user and city data for wolne status
  if (cleanedData.status === 'wolne') {
    cleanedData.userId = null;
    cleanedData.city = null;
    cleanedData.previousUserId = null;
    cleanedData.toUserId = null;
  }

  // Clear all user and city data for niewydany status
  if (cleanedData.status === 'niewydany') {
    cleanedData.userId = null;
    cleanedData.city = null;
    cleanedData.previousUserId = null;
    cleanedData.toUserId = null;
  }

  return cleanedData;
};