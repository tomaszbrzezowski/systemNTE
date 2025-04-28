import { EventStatus, User } from '../types';
import { EVENT_STATUSES } from './statusConstants';

export const getStatusLabel = (status: EventStatus): string => {
  const statusInfo = EVENT_STATUSES[status];
  return statusInfo ? statusInfo.label : 'Unknown';
};

export const getStatusColor = (status: EventStatus): string => {
  const statusInfo = EVENT_STATUSES[status];
  return statusInfo ? statusInfo.color : 'bg-gray-300';
};

export const getCurrentUserStatusInfo = (userId: string | undefined, status: EventStatus | undefined, users: User[]): string | null => {
  if (!userId || !status) return null;
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  
  const statusLabel = getStatusLabel(status);
  return `${user.name} (${statusLabel})`;
};

export const validateStatusTransition = (
  currentStatus: EventStatus | undefined,
  newStatus: EventStatus,
  userRole: string
): boolean => {
  if (!currentStatus) return true;
  
  // Administrators can make any status change
  if (userRole === 'administrator') return true;

  // Define allowed transitions for each status
  const allowedTransitions: Record<EventStatus, EventStatus[]> = {
    wydany: ['w_trakcie', 'do_przejęcia'],
    w_trakcie: ['zrobiony', 'przekazywany'],
    zrobiony: ['przekazywany'],
    przekazywany: [],
    do_przejęcia: [],
    wolne: [],
    niewydany: []
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
};