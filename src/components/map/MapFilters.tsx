import React from 'react';
import { User, Calendar as CalendarType, City } from '../../types';
import CalendarDropdown from './CalendarDropdown';
import { useAuth } from '../../context/AuthContext';

interface MapFiltersProps {
  users: User[];
  calendars: CalendarType[];
  selectedUserId: string;
  selectedCalendarIds: string[];
  onUserChange: (userId: string) => void;
  onCalendarChange: (calendarIds: string[]) => void;
}

const MapFilters: React.FC<MapFiltersProps> = ({
  users,
  calendars,
  selectedUserId,
  selectedCalendarIds,
  onUserChange,
  onCalendarChange,
}) => {
  const { currentUser } = useAuth();

  // Get user options based on role
  const userOptions = currentUser?.role === 'administrator'
    ? [
        { id: '', name: 'Wszyscy użytkownicy' },
        ...users
      ]
    : [
        { id: '', name: 'Wszyscy użytkownicy' },
        currentUser
      ].filter(Boolean) as User[];

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center space-x-2">
        <label className="text-white text-sm font-medium">Użytkownik:</label>
        <select
          value={selectedUserId}
          onChange={(e) => onUserChange(e.target.value)}
          className="bg-black/20 text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-white/40 focus:border-transparent min-w-[200px] hover:bg-white/10 transition-colors"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        >
          {userOptions.map(user => (
            <option key={user.id} value={user.id} className="text-white bg-black/70">
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <CalendarDropdown
        calendars={calendars}
        selectedCalendarIds={selectedCalendarIds}
        onCalendarChange={onCalendarChange}
      />
    </div>
  );
};

export default MapFilters;