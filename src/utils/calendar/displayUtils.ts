import { CalendarEvent, User } from '../../types';
import { EVENT_STATUSES } from '../statusConstants';
import { formatShortName } from '../userNameUtils';

export const getEventDisplayInfo = (
  event: CalendarEvent,
  users: User[],
  currentUser: User | null
) => {
  const user = users.find(u => u.id === event.userId);
  const statusInfo = EVENT_STATUSES[event.status];
  const isCurrentUser = currentUser?.id === event.userId;
  
  // Fixed supervisor-organizer relationship check
  const isSupervisorOrganizer = Boolean(
    currentUser?.role === 'supervisor' && 
    user?.role === 'organizator' &&
    (
      currentUser.organizatorIds?.includes(user.id) || 
      user.supervisorId === currentUser.id
    )
  );

  return {
    userName: user ? formatShortName(user.name) : '',
    statusColor: statusInfo?.color || 'bg-gray-300',
    isCurrentUser,
    isSupervisorOrganizer,
    displayStyle: isSupervisorOrganizer ? 'font-bold text-blue-600' :
                 isCurrentUser ? 'font-bold text-gray-900' : 
                 'text-gray-700'
  };
};