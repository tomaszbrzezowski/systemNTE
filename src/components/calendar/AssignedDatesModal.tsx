import React, { useState, useMemo } from 'react';
import { X, Search, MapPin, Calendar, Filter, ArrowUpDown } from 'lucide-react';
import { User, Calendar as CalendarType, CalendarEvent } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';
import { EVENT_STATUSES } from '../../utils/statusConstants';
import { truncateText } from '../../utils/textUtils';
import { sortEvents, SortField, SortDirection } from '../../utils/sortUtils';

interface AssignedDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendars: CalendarType[];
  currentUser: User;
  users: User[];
}

const AssignedDatesModal: React.FC<AssignedDatesModalProps> = ({
  isOpen,
  onClose,
  calendars,
  currentUser,
  users,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedVoivodeship, setSelectedVoivodeship] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    calendar: '',
    user: '',
    voivodeship: '',
    city: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const assignedEvents = useMemo(() => {
    const events: { calendar: CalendarType; event: CalendarEvent }[] = [];
    
    calendars.forEach(calendar => {
      calendar.events.forEach(event => {
        // Skip events with 'wolne' status
        if (event.status === 'wolne') return;

        if (currentUser.role === 'administrator') {
          if (event.userId) {
            events.push({ calendar, event });
          }
          return;
        }

        if (currentUser.role === 'supervisor') {
          const isOwnEvent = event.userId === currentUser.id;
          const isOrganizersEvent = currentUser.organizatorIds.includes(event.userId);
          
          if (isOwnEvent || isOrganizersEvent) {
            events.push({ calendar, event });
          }
          return;
        }

        if (currentUser.role === 'organizator' && event.userId === currentUser.id) {
          events.push({ calendar, event });
        }
      });
    });

    return events;
  }, [calendars, currentUser]);

  const uniqueCalendars = useMemo(() => 
    Array.from(new Set(assignedEvents.map(({ calendar }) => calendar.name))),
    [assignedEvents]
  );

  const uniqueUsers = useMemo(() => 
    Array.from(new Set(assignedEvents.map(({ event }) => event.userId))),
    [assignedEvents]
  );

  const uniqueVoivodeships = useMemo(() => 
    Array.from(new Set(assignedEvents.map(({ event }) => event.city?.voivodeship).filter(Boolean))),
    [assignedEvents]
  );

  const uniqueCities = useMemo(() => 
    Array.from(new Set(assignedEvents.map(({ event }) => event.city?.name).filter(Boolean))),
    [assignedEvents]
  );

  const filteredEvents = useMemo(() => {
    const filtered = assignedEvents.filter(({ calendar, event }) => {
      const searchString = searchTerm.toLowerCase();
      const userName = users.find(u => u.id === event.userId)?.name.toLowerCase() || '';
      const calendarName = calendar.name.toLowerCase();
      const cityName = event.city?.name.toLowerCase() || '';
      const voivodeship = event.city?.voivodeship.toLowerCase() || '';
      const date = formatDate(event.date);
      const eventDate = event.date.toISOString().split('T')[0];

      const matchesSearch = userName.includes(searchString) ||
                           calendarName.includes(searchString) ||
                           cityName.includes(searchString) ||
                           voivodeship.includes(searchString) ||
                           date.includes(searchString);

      const matchesCalendar = !appliedFilters.calendar || calendar.name === appliedFilters.calendar;
      const matchesUser = !appliedFilters.user || event.userId === appliedFilters.user;
      const matchesVoivodeship = !appliedFilters.voivodeship || event.city?.voivodeship === appliedFilters.voivodeship;
      const matchesCity = !appliedFilters.city || event.city?.name === appliedFilters.city;
      const matchesDateRange = (!appliedFilters.startDate || eventDate >= appliedFilters.startDate) && 
                             (!appliedFilters.endDate || eventDate <= appliedFilters.endDate);

      return matchesSearch && 
             matchesCalendar && 
             matchesUser && 
             matchesVoivodeship && 
             matchesCity &&
             matchesDateRange;
    });

    return sortEvents(filtered, sortField, sortDirection);
  }, [
    assignedEvents,
    searchTerm,
    appliedFilters,
    sortField,
    sortDirection,
    users
  ]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      calendar: selectedCalendar,
      user: selectedUser,
      voivodeship: selectedVoivodeship,
      city: selectedCity,
      startDate,
      endDate
    });
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedCalendar('');
    setSelectedUser('');
    setSelectedVoivodeship('');
    setSelectedCity('');
    setStartDate('');
    setEndDate('');
    setAppliedFilters({
      calendar: '',
      user: '',
      voivodeship: '',
      city: '',
      startDate: '',
      endDate: ''
    });
  };

  const getUserName = (userId: string): string => {
    return users.find(u => u.id === userId)?.name || '';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return <ArrowUpDown className={`w-4 h-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl mx-4 flex flex-col h-[90vh]">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">
              Przypisane terminy
            </h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj terminów..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showFilters ? 'bg-red-100 text-red-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                </button>
                {showFilters && (
                  <>
                    <button
                      onClick={handleClearFilters}
                      className="px-3 py-1.5 text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                    >
                      Wyczyść
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-3 py-1.5 bg-white text-red-900 rounded-lg hover:bg-white/90 transition-colors text-sm font-medium"
                    >
                      Zastosuj
                    </button>
                  </>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[50vh] sm:max-h-none p-2 -mx-2">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Data od
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Data do
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Kalendarz
                  </label>
                  <select
                    value={selectedCalendar}
                    onChange={(e) => setSelectedCalendar(e.target.value)}
                    className="modal-select"
                  >
                    <option value="">Wszystkie kalendarze</option>
                    {uniqueCalendars.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Użytkownik
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="modal-select"
                  >
                    <option value="">Wszyscy użytkownicy</option>
                    {uniqueUsers.map(userId => (
                      <option key={userId} value={userId}>{getUserName(userId)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Województwo
                  </label>
                  <select
                    value={selectedVoivodeship}
                    onChange={(e) => {
                      setSelectedVoivodeship(e.target.value);
                      setSelectedCity(''); // Reset city when voivodeship changes
                    }}
                    className="modal-select"
                  >
                    <option value="">Wszystkie województwa</option>
                    {uniqueVoivodeships.map(voivodeship => (
                      <option key={voivodeship} value={voivodeship}>{voivodeship}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Miasto
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="modal-select"
                  >
                    <option value="">Wszystkie miasta</option>
                    {uniqueCities
                      .filter(city => !selectedVoivodeship || 
                        assignedEvents.some(({ event }) => 
                          event.city?.name === city && 
                          event.city.voivodeship === selectedVoivodeship
                        )
                      )
                      .map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            )}
            {Object.values(appliedFilters).some(Boolean) && !showFilters && (
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 mt-2">
                <span className="text-sm text-white">
                  Aktywne filtry: {Object.values(appliedFilters).filter(Boolean).length}
                </span>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-white hover:text-white/80 transition-colors"
                >
                  Wyczyść
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {filteredEvents.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <button
                  onClick={() => handleSort('calendar')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>Kalendarz</span>
                  {getSortIcon('calendar')}
                </button>
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>Data</span>
                  {getSortIcon('date')}
                </button>
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </div>
              {filteredEvents.map(({ calendar, event }) => (
                <div
                  key={`${calendar.id}-${event.date}`}
                  className="flex items-center justify-between py-1 px-2 rounded border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {calendar.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(event.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${EVENT_STATUSES[event.status].color}`} />
                      <span className="text-xs font-medium text-gray-900">
                        {getUserName(event.userId)}
                      </span>
                    </div>

                    {event.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-500">
                          {truncateText(event.city.name, 15)} ({getVoivodeshipAbbreviation(event.city.voivodeship)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Brak przypisanych terminów
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignedDatesModal;