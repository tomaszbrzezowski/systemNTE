import { EventStatus } from '../types';
import { getDaysDifference } from './dateUtils';

export const validateStatusChange = (
  currentStatus: EventStatus,
  newStatus: EventStatus,
  userRole: string
): boolean => {
  // Administrators can make any status change
  if (userRole === 'administrator') return true;

  // Allowed status changes for organizers and supervisors
  const allowedChanges: Record<EventStatus, EventStatus[]> = {
    wydany: ['w_trakcie', 'zrobiony', 'do_przekazania'],
    w_trakcie: ['zrobiony', 'do_przekazania'],
    zrobiony: ['do_przekazania'],
    do_przekazania: ['do_przejęcia'],
    do_przejęcia: ['przekazywany', 'waiting'],
    przekazywany: [],
    waiting: [],
    wolne: [],
    niewydany: []
  };

  return allowedChanges[currentStatus]?.includes(newStatus) || false;
};

export const shouldBlinkStatus = (eventDate: Date, status: EventStatus): boolean => {
  if (status !== 'wydany') return false;

  const today = new Date();
  if (eventDate < today) return false;

  const daysUntilEvent = getDaysDifference(today, eventDate);
  return daysUntilEvent <= 30;
};

export const handleStatusTransition = async (
  currentStatus: EventStatus,
  newStatus: EventStatus,
  userId: string,
  eventId: string,
  targetUserId?: string
): Promise<boolean> => {
  try {
    // Status transition validation
    if (newStatus === 'do_przekazania' && !targetUserId) {
      throw new Error('Target user is required for transfer');
    }

    // Handle specific transitions
    switch (newStatus) {
      case 'do_przekazania':
        // Set status to waiting for target user acceptance
        return true;

      case 'przekazywany':
        // Target user accepted the transfer
        return true;

      case 'waiting':
        // Event is waiting to be taken over
        return true;

      default:
        return true;
    }
  } catch (error) {
    console.error('Error handling status transition:', error);
    return false;
  }
};

export const getStatusTransitionMessage = (
  currentStatus: EventStatus,
  newStatus: EventStatus
): string => {
  const transitions: Record<string, string> = {
    'do_przekazania-waiting': 'Oczekiwanie na potwierdzenie przejęcia',
    'waiting-przekazywany': 'Termin został przejęty',
    'do_przejęcia-przekazywany': 'Termin został przekazany'
  };

  return transitions[`${currentStatus}-${newStatus}`] || '';
};