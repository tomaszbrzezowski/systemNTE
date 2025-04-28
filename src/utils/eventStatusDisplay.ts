import { EventStatus } from '../types';
import { EVENT_STATUSES } from './statusConstants';

export const getAvailableStatusTransitions = (currentStatus: EventStatus, userRole: string): EventStatus[] => {
  const baseTransitions: Record<EventStatus, EventStatus[]> = {
    'niewydany': userRole === 'administrator' ? ['wydany', 'wolne'] : ['wolne'],
    'wydany': userRole === 'administrator' 
      ? ['w_trakcie', 'zrobiony', 'przekaz', 'do_przejęcia']
      : ['w_trakcie', 'zrobiony', 'przekaz', 'do_przejęcia'],
    'w_trakcie': ['zrobiony', 'przekaz', 'do_przejęcia'],
    'zrobiony': ['przekaz'],
    'wolne': ['wydany'],
    'przekaz': ['przekazywany'],
    'przekazywany': ['przekazany', 'wydany'],
    'przekazany': userRole === 'administrator' ? ['wydany'] : ['w_trakcie'],
    'do_przejęcia': userRole === 'administrator' ? ['wydany'] : ['w_trakcie']
  };

  // Administrators can make any transition except transfer-related ones
  if (userRole === 'administrator') {
    return [
      'wydany',
      'w_trakcie',
      'zrobiony',
      'do_przejęcia',
      'wolne',
      'niewydany'
    ];
  }

  // For supervisors and organizers, return allowed transitions based on current status
  if (userRole === 'supervisor' || userRole === 'organizator') {
    return baseTransitions[currentStatus] || [];
  }

  return [];
};

export interface StatusDisplayInfo {
  color: string;
  label: string;
  description: string;
  isDisabled?: boolean;
}

export const getStatusDisplayInfo = (
  status: EventStatus | undefined,
  userRole: string,
  currentStatus?: EventStatus
): StatusDisplayInfo => {
  const defaultInfo: StatusDisplayInfo = {
    color: 'bg-gray-300',
    label: 'Nieznany',
    description: 'Nieznany status',
    isDisabled: true
  };

  if (!status || !EVENT_STATUSES[status]) {
    return defaultInfo;
  }

  const availableTransitions = currentStatus ? 
    getAvailableStatusTransitions(currentStatus, userRole) : 
    [];

  const statusInfo = EVENT_STATUSES[status];
  return {
    color: statusInfo.color || defaultInfo.color,
    label: statusInfo.label || defaultInfo.label,
    description: statusInfo.description || defaultInfo.description,
    isDisabled: currentStatus ? !availableTransitions.includes(status) : false
  };
};