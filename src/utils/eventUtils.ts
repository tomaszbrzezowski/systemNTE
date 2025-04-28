import { CalendarEvent } from '../types';

export const validateEventData = (eventData: Partial<CalendarEvent>): boolean => {
  if (!eventData.status) return false;

  // For niewydany or wolne status, no additional validation needed
  if (eventData.status === 'niewydany' || eventData.status === 'wolne') {
    return true;
  }

  // For do_przejęcia status, only userId is required
  if (eventData.status === 'do_przejęcia') {
    return !!eventData.userId;
  }

  // For przekazywany status, userId and previousUserId are required
  if (eventData.status === 'przekazywany') {
    return !!eventData.userId && !!eventData.previousUserId;
  }

  // For all other statuses
  if (!eventData.userId) return false;

  // City is required for all statuses except wydany, przekazywany, and do_przejęcia
  if (eventData.status !== 'wydany' && 
      eventData.status !== 'przekazywany' && 
      eventData.status !== 'do_przejęcia' && 
      !eventData.city) {
    return false;
  }

  return true;
};

export const formatEventDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isValidEventStatus = (status: string): boolean => {
  const validStatuses = [
    'wydany',
    'zrobiony',
    'przekazywany',
    'do_przejęcia',
    'w_trakcie',
    'wolne',
    'niewydany'
  ];
  return validStatuses.includes(status);
};