import { CalendarEvent, User } from '../types';

// Add new helper function to determine what location info to show
export const getLocationDisplay = (
  event: CalendarEvent,
  currentUser: User | null
): { showCity: boolean; showLocation: boolean; voivodeship: string } => {
  if (!event.city) return { 
    showCity: false,
    showLocation: false,
    voivodeship: '' 
  };
  
  const isCurrentUserEvent = currentUser?.id === event.userId;
  const isAdminOrSupervisor = currentUser?.role === 'administrator' || currentUser?.role === 'supervisor';
  
  // Check if the city is assigned to supervisor or their organizers
  const isSupervisorCityAssigned = currentUser?.role === 'supervisor' && (
    currentUser.assignedCityIds.includes(event.city.id) ||
    (event.userId && currentUser.organizatorIds.includes(event.userId))
  );

  // Only show location for:
  // - Admin users
  // - Current user's own events
  // - Supervisor viewing their organizers' events
  const showLocation = isAdminOrSupervisor || isCurrentUserEvent || isSupervisorCityAssigned;

  // Show city + voivodeship for:
  // - Admin users
  // - Current user's own events
  // - Supervisor viewing their assigned cities
  const showCity = currentUser?.role === 'administrator' || 
                   isCurrentUserEvent || 
                   isSupervisorCityAssigned;

  return {
    showCity,
    showLocation,
    voivodeship: event.city.voivodeship
  };
};

export const getEventDisplayStyle = (
  isCurrentUser: boolean,
  isSupervisorAssigned: boolean
): string => {
  if (isCurrentUser) return 'font-bold';
  if (isSupervisorAssigned) return 'font-bold text-blue-900';
  return 'font-normal';
};

export const getEventUserInfo = (
  event: CalendarEvent,
  users: User[],
  currentUser: User | null
): {
  user?: User;
  previousUser?: User;
  isCurrentUser: boolean;
  isSupervisorAssigned: boolean;
} => {
  const user = users.find(u => u.id === event.userId);
  const previousUser = event.previousUserId ? users.find(u => u.id === event.previousUserId) : undefined;
  const isCurrentUser = !!currentUser && event.userId === currentUser.id;
  
  const isSupervisorAssigned = !!currentUser && 
    currentUser.role === 'supervisor' && 
    !!user && 
    (currentUser.organizatorIds.includes(user.id) || user.supervisorId === currentUser.id);

  return {
    user,
    previousUser,
    isCurrentUser,
    isSupervisorAssigned
  };
};