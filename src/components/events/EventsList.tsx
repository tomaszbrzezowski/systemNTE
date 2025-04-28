import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Circle, Search, Filter, X, Eye, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getCalendars } from '../../services/calendar';
import { getUsers } from '../../services/auth';
import { User } from '../../types';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';
import { formatDate } from '../../utils/dateUtils';
import { EVENT_STATUSES } from '../../utils/statusConstants';

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface Filters {
  search: string;
  status: string;
  calendar: string;
  userId: string;
  startDate: string;
  endDate: string;
  voivodeship: string;
}

const EventsList: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<{
    calendarName: string;
    date: Date;
    city?: { name: string; voivodeship: string } | null;
    status: string;
    userId: string | null;
  }[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyMyEvents, setShowOnlyMyEvents] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    calendar: '',
    userId: '',
    startDate: '',
    endDate: '',
    voivodeship: ''
  });

  const uniqueCalendars = [...new Set(events.map(event => event.calendarName))];
  const uniqueVoivodeships = [...new Set(events.map(event => event.city?.voivodeship).filter(Boolean))];
  const uniqueUsers = [...new Set(events.map(event => event.userId).filter(Boolean))];

  // Get current user from auth context
  const { currentUser } = useAuth();

  const filteredEvents = events.filter(event => {
    const matchesSearch = !filters.search || 
      event.calendarName.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.city?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.city?.voivodeship.toLowerCase().includes(filters.search.toLowerCase()) ||
      users.find(u => u.id === event.userId)?.name.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = !filters.status || event.status === filters.status;
    const matchesCalendar = !filters.calendar || event.calendarName === filters.calendar;
    const matchesVoivodeship = !filters.voivodeship || event.city?.voivodeship === filters.voivodeship;
    const matchesUser = !filters.userId || event.userId === filters.userId;
    
    const matchesUserFilter = !showOnlyMyEvents || event.userId === currentUser?.id;
    
    const eventDate = new Date(event.date);
    const matchesDateRange = (!filters.startDate || eventDate >= new Date(filters.startDate)) &&
                           (!filters.endDate || eventDate <= new Date(filters.endDate));

    return matchesSearch && matchesStatus && matchesCalendar && matchesVoivodeship && 
           matchesDateRange && matchesUser && matchesUserFilter;
  });

  // Sort events based on current sort configuration
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
    // Helper function to compare dates safely
    const compareDates = (dateA: Date, dateB: Date) => {
      return dateA.getTime() - dateB.getTime();
    };

    switch (sortConfig.field) {
      case 'status':
        return direction * (EVENT_STATUSES[a.status]?.label || '').localeCompare(EVENT_STATUSES[b.status]?.label || '');
      case 'date':
        return direction * compareDates(a.date, b.date);
      case 'city':
        return direction * ((a.city?.name || '').localeCompare(b.city?.name || ''));
      case 'voivodeship':
        return direction * ((a.city?.voivodeship || '').localeCompare(b.city?.voivodeship || ''));
      case 'calendar':
        return direction * a.calendarName.localeCompare(b.calendarName);
      case 'user':
        const userA = users.find(u => u.id === a.userId)?.name || '';
        const userB = users.find(u => u.id === b.userId)?.name || '';
        return direction * userA.localeCompare(userB);
      default:
        return 0;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedEvents.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedEvents.slice(indexOfFirstRecord, indexOfLastRecord);

  const handleSort = (field: string) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortConfig.field !== field) return null;
    return (
      sortConfig.direction === 'asc' 
        ? <ArrowUp className="w-4 h-4 ml-1 text-red-600" />
        : <ArrowDown className="w-4 h-4 ml-1 text-red-600" />
    );
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filters, recordsPerPage]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const [calendars, loadedUsers] = await Promise.all([
          supabase
            .from('calendar_events')
            .select(`
              id,
              calendar_id,
              date,
              user_id,
              city_id,
              status,
              previous_user_id,
              to_user_id,
              cities (
                id,
                name,
                voivodeship
              ),
              calendars (
                id,
                name
              )
            `)
            .order('date', { ascending: false }),
          getUsers()
        ]);

        if (!calendars.data) {
          throw new Error('Failed to fetch calendar events');
        }

        const allEvents = calendars.data
          .filter(event => event.status !== 'niewydany' && event.status !== 'wolne')
          .map(event => ({
            calendarName: event.calendars?.name || '',
            date: new Date(event.date),
            city: event.cities ? {
              id: event.cities.id,
              name: event.cities.name,
              voivodeship: event.cities.voivodeship
            } : null,
            status: event.status,
            userId: event.user_id
          }));

        setEvents(allEvents);
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Failed to load events:', error);
        throw new Error('Failed to fetch calendar events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Przypisane terminy
          {showOnlyMyEvents && (
            <span className="ml-2 text-sm font-normal text-gray-500"> 
              (Moje terminy)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyMyEvents}
              onChange={(e) => setShowOnlyMyEvents(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-900"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {showOnlyMyEvents ? "Tylko moje wydarzenia" : "Wszystkie wydarzenia"}
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
                if (showFilters) setShowFilters(false);
              }}
              className={`w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm transition-all duration-300 ${
                showFilters ? 'rounded-t-none' : ''
              }`}
              placeholder="Szukaj po nazwie, mieście lub użytkowniku..."
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              showFilters ? 'bg-red-100 text-red-800 ring-2 ring-red-200' : 'hover:bg-gray-100'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {showFilters && !isMobileMenuOpen && (
          <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-100 space-y-6 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Wszystkie statusy</option>
                  {Object.entries(EVENT_STATUSES).map(([value, info]) => (
                    <option key={value} value={value}>{info.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Użytkownik
                </label>
                <select
                  value={filters.userId}
                  onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Wszyscy użytkownicy</option>
                  {users.filter(user => uniqueUsers.includes(user.id)).map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kalendarz
                </label>
                <select
                  value={filters.calendar}
                  onChange={(e) => setFilters(prev => ({ ...prev, calendar: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Wszystkie kalendarze</option>
                  {uniqueCalendars.map(calendar => (
                    <option key={calendar} value={calendar}>{calendar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Województwo
                </label>
                <select
                  value={filters.voivodeship}
                  onChange={(e) => setFilters(prev => ({ ...prev, voivodeship: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Wszystkie województwa</option>
                  {uniqueVoivodeships.map(voivodeship => (
                    <option key={voivodeship} value={voivodeship}>{voivodeship}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data od
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {Object.values(filters).some(Boolean) && (
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              Aktywne filtry: {Object.values(filters).filter(Boolean).length}
            </span>
            <button
              onClick={() => setFilters({
                search: '',
                status: '',
                calendar: '',
                startDate: '',
                endDate: '',
                voivodeship: '',
                userId: ''
              })}
              className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Wyczyść filtry
            </button>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-gray-200">
          <table className="w-full divide-y divide-gray-100">
            <thead>
              <tr className="h-9">
                <th className="bg-gray-50/50 w-12 px-4 py-3 text-left text-xs font-medium text-gray-600 first:rounded-tl-lg">
                  #
                </th>
                <th className="bg-gray-50/50 w-24 px-4 py-3 text-left text-xs font-medium text-gray-600 cursor-pointer first:rounded-tl-lg">
                  <button
                    onClick={() => handleSort('status')}
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      sortConfig.field === 'status' ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Sort by status"
                  >
                    <span>Status</span>
                    <SortIcon field="status" />
                  </button>
                  {!sortConfig.field && <ArrowDown className="w-4 h-4 ml-1 text-gray-400" />}
                </th>
                <th className="bg-gray-50/50 px-4 py-3 text-left text-xs font-medium text-gray-600 cursor-pointer">
                  <button
                    onClick={() => handleSort('date')}
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      sortConfig.field === 'date' ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Sort by date"
                  >
                    <span>Data</span>
                    <SortIcon field="date" />
                  </button>
                  {!sortConfig.field && <ArrowDown className="w-4 h-4 ml-1 text-gray-400" />}
                </th>
                <th className="bg-gray-50/50 hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-600 cursor-pointer">
                  <button
                    onClick={() => handleSort('city')}
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      sortConfig.field === 'city' ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Sort by city"
                  >
                    <span>Miasto</span>
                    <SortIcon field="city" />
                  </button>
                </th>
                <th className="bg-gray-50/50 hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-600 cursor-pointer">
                  <button
                    onClick={() => handleSort('voivodeship')}
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      sortConfig.field === 'voivodeship' ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Sort by voivodeship"
                  >
                    <span>Województwo</span>
                    <SortIcon field="voivodeship" />
                  </button>
                </th>
                <th className="bg-gray-50/50 hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-600 cursor-pointer">
                  <button
                    onClick={() => handleSort('calendar')}
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      sortConfig.field === 'calendar' ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Sort by calendar"
                  >
                    <span>Kalendarz</span>
                    <SortIcon field="calendar" />
                  </button>
                </th>
                <th className="bg-gray-50/50 hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-600 cursor-pointer last:rounded-tr-lg">
                  <button
                    onClick={() => handleSort('user')}
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      sortConfig.field === 'user' ? 'text-red-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Sort by user"
                  >
                    <span>Użytkownik</span>
                    <SortIcon field="user" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRecords.map((event, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors h-9">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {indexOfFirstRecord + index + 1}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full mr-1 sm:mr-2 ${EVENT_STATUSES[event.status]?.color || 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-900">
                        {EVENT_STATUSES[event.status]?.label || 'Nieznany'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(event.date)}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {event.city?.name || '-'}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                    {event.city?.voivodeship || '-'}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {event.calendarName}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {users.find(u => u.id === event.userId)?.name || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    <a
                      onClick={() => navigate(`/events/${encodeURIComponent(event.calendarName)}_${event.date.toISOString().split('T')[0]}`)}
                      className="px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Szczegóły</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">Pokaż</span>
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border-gray-300 py-1.5 text-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">na stronie</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700">
                  Pokazuje <span className="font-medium">{indexOfFirstRecord + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">{Math.min(indexOfLastRecord, sortedEvents.length)}</span>
                  {' '}z{' '}
                  <span className="font-medium">{sortedEvents.length}</span>
                </p>
                
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm ml-4" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Poprzednia
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === pageNumber
                            ? 'z-10 bg-red-900 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Następna
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsList;