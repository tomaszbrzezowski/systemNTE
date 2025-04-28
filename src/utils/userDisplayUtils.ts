import { CalendarEvent, User } from '../types';
import { getStatusInfo } from './statusConstants';
import { formatShortName } from './userNameUtils';
import { getLocationDisplay, getEventUserInfo } from './eventDisplayUtils';

export const getEventStatusInfo = (
  event: CalendarEvent,
  users: User[],
  currentUser: User | null
): {
  userName: string;
  previousUserName?: string;
  statusColor: string;
  isCurrentUser: boolean;
  isSupervisorAssigned: boolean;
  cityInfo?: string;
  voivodeship?: string;
} => {
  const statusInfo = getStatusInfo(event.status);
  const { user, previousUser, isCurrentUser, isSupervisorAssigned } = getEventUserInfo(event, users, currentUser);
  const locationInfo = event.city ? getLocationDisplay(event, currentUser) : null;

  const userName = user ? formatShortName(user.name) : '';
  const previousUserName = previousUser ? formatShortName(previousUser.name) : undefined;

  return {
    userName,
    previousUserName,
    statusColor: statusInfo.color,
    isCurrentUser,
    isSupervisorAssigned,
    cityInfo: locationInfo?.showCity ? event.city?.name : undefined,
    voivodeship: locationInfo?.voivodeship
  };
};

export const getDisplayName = (user: User | undefined, currentUser: User | null): string => {
  if (!user) return '';
  return user.name;
};