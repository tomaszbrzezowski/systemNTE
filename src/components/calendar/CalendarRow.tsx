import React from 'react';
import { MapPin, User } from 'lucide-react';
import { CalendarEvent, User as UserType } from '../../types';
import { getDayName, shouldBlinkStatus } from '../../utils/dateUtils';
import { formatShortName } from '../../utils/userNameUtils';
import { isHoliday, getHolidayName } from '../../utils/holidayUtils';
import { getEventStatusInfo } from '../../utils/userDisplayUtils';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';
import { getLocationDisplay } from '../../utils/eventDisplayUtils';
import { truncateText } from '../../utils/textUtils';
import Tooltip from '../common/Tooltip';

interface CalendarRowProps {
  day: number;
  date: Date;
  event?: CalendarEvent;
  users: UserType[];
  currentUser: UserType;
  enableWeekends: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  rowClassName: string;
}

const CalendarRow: React.FC<CalendarRowProps> = ({
  day,
  date,
  event,
  users,
  currentUser,
  enableWeekends,
  onClick,
  onMouseEnter,
  rowClassName,
}) => {
  const isWeekendDay = isHoliday(date);
  const dayName = getDayName(date, day);
  const holidayName = getHolidayName(date);
  const assignedUser = event?.userId && event?.status !== 'niewydany'
    ? users.find(u => u.id === event.userId)
    : null;
  const previousUser = event?.previousUserId && (event?.status === 'przekazany' || event?.status === 'do_przejęcia')
    ? users.find(u => u.id === event.previousUserId)
    : null;
  const shouldBlink = event && shouldBlinkStatus(date, event.status);
  const isSupervisorOrganizer = currentUser.role === 'supervisor' &&
    assignedUser?.role === 'organizator' &&
    (currentUser.organizatorIds?.includes(assignedUser.id) || assignedUser?.supervisorId === currentUser.id);
  const isCurrentUserEvent = event?.userId === currentUser.id;
  const isWolneStatus = event?.status === 'wolne';
  const isNiewydanyStatus = !event || event.status === 'niewydany';
  const isPrzekazywanyStatus = event?.status === 'przekazywany';
  const isTargetUser = event?.toUserId === currentUser.id;
  const isAdmin = currentUser.role === 'administrator';

  // Add blinking animation for przekazywany status when user is the target
  const shouldBlinkYellow = isPrzekazywanyStatus && isTargetUser;

  const getTooltipText = (city: { name: string; voivodeship: string }) => {
    // Show full details for admins, event owners, and supervisor's organizers
    if (isAdmin || isCurrentUserEvent || isSupervisorOrganizer) {
      return `${city.name}, ${city.voivodeship}`;
    }
    // Show only voivodeship for other users
    return city.voivodeship;
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`h-6 min-h-[24px] w-full flex items-center text-xs px-1.5 py-1 rounded transition-colors duration-150 border ${rowClassName} ${
        !isWeekendDay || enableWeekends || event ? 'cursor-pointer' : 'cursor-not-allowed'
      } ${isWolneStatus ? 'bg-gray-100 border-gray-200' : ''} ${
        shouldBlinkYellow ? 'animate-pulse-yellow' : ''
      }`}
    >
      <div className="flex items-center w-9 flex-shrink-0">
        <span className={`font-medium text-left ${
          (isWeekendDay && !enableWeekends && !event) || isWolneStatus ? 'text-gray-500' : 'text-gray-700'
        }`}>
          {day}
        </span>
        <span className="ml-1 text-gray-500 text-left">
          {dayName}
        </span>
      </div>
      
      {(isWeekendDay && !enableWeekends && !event) || isWolneStatus ? (
        <Tooltip text={isWolneStatus ? 'Dzień wolny' : (holidayName || 'Weekend')}>
          <span className={`flex-1 ml-0.5 truncate ${holidayName ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
            {isWolneStatus ? 'Dzień wolny' : (holidayName || 'Weekend')}
          </span>
        </Tooltip>
      ) : (
        <div className="flex items-center justify-between min-w-0 flex-1 ml-1">
          {isNiewydanyStatus ? (
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-white border border-gray-300" />
              <span className="text-gray-300">Niewydany</span>
            </div>
          ) : (
            <div className="flex items-center min-w-0 gap-x-1.5 flex-1">
              <span 
                className={`w-3.5 h-3.5 rounded-full ${getEventStatusInfo(event, users, currentUser).statusColor} ${
                  shouldBlink ? 'animate-pulse-fast' : ''
                }`} 
              />
              {assignedUser && (
                <div className="flex items-center space-x-1"> 
                  {event?.status === 'przekazany' && event.previousUserId && (
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        <Tooltip text={previousUser?.name || ''}>
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        </Tooltip>
                      </div>
                      <span className="text-gray-400">/</span>
                    </div>
                  )}
                  <span className={`text-sm truncate ${isCurrentUserEvent ? 'font-bold text-gray-900' : isSupervisorOrganizer ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                    {formatShortName(assignedUser.name)}
                  </span>
                  {(event.status === 'przekazywany' || event.status === 'do_przejęcia') && event.toUserId && (
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400 mx-1">/</span>
                      <Tooltip text={`Przekazywany do: ${users.find(u => u.id === event.toUserId)?.name || ''}`}>
                        <div className="flex items-center">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </Tooltip>
                    </div>
                  )}
                </div>
              )}
              {event?.city && (
                <span className="text-[10px] text-gray-500 ml-auto">
                  <Tooltip text={getTooltipText(event.city)}>
                    <span className="whitespace-nowrap">
                      {(isAdmin || isCurrentUserEvent || isSupervisorOrganizer)
                        ? `${truncateText(event.city.name, 15)} (${getVoivodeshipAbbreviation(event.city.voivodeship)})`
                        : event.city.voivodeship}
                    </span>
                  </Tooltip>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarRow;