import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Calendar, Clock, Search, Filter, X } from 'lucide-react';
import { getCalendars } from '../../services/calendar';
import { Calendar as CalendarType, CalendarEvent } from '../../types';
import { EVENT_STATUSES } from '../../utils/statusConstants';

interface Filters {
  search: string;
  status: string;
  calendar: string;
  startDate: string;
  endDate: string;
  voivodeship: string;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [calendars, setCalendars] = useState<CalendarType[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    calendar: '',
    startDate: '',
    endDate: '',
    voivodeship: ''
  });
  const [showSpektaklSection, setShowSpektaklSection] = useState(false);
  const [spektaklData, setSpektaklData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  useEffect(() => {
    const loadCalendars = async () => {
      try {
        const loadedCalendars = await getCalendars();
        setCalendars(loadedCalendars);
      } catch (error) {
        console.error('Failed to load calendars:', error);
      }
    };

    loadCalendars();
  }, []);

  // Filter events that belong to the current user
  const userEvents = calendars.flatMap(calendar => 
    calendar.events.filter(event => 
      event.userId === currentUser?.id && 
      event.status !== 'niewydany' && 
      event.status !== 'wolne'
    ).map(event => ({
      ...event,
      calendarName: calendar.name
    }))
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

  const uniqueCalendars = [...new Set(userEvents.map(event => event.calendarName))];
  const uniqueVoivodeships = [...new Set(userEvents.map(event => event.city?.voivodeship).filter(Boolean))];

  const filteredEvents = userEvents.filter(event => {
    const matchesSearch = !filters.search || 
      event.calendarName.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.city?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.city?.voivodeship.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = !filters.status || event.status === filters.status;
    const matchesCalendar = !filters.calendar || event.calendarName === filters.calendar;
    const matchesVoivodeship = !filters.voivodeship || event.city?.voivodeship === filters.voivodeship;
    
    const eventDate = new Date(event.date);
    const matchesDateRange = (!filters.startDate || eventDate >= new Date(filters.startDate)) &&
                           (!filters.endDate || eventDate <= new Date(filters.endDate));

    return matchesSearch && matchesStatus && matchesCalendar && matchesVoivodeship && matchesDateRange;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvents.length === 0) {
      alert('Wybierz przynajmniej jeden termin');
      return;
    }

    if (showSpektaklSection && (!spektaklData.title || !spektaklData.startTime || !spektaklData.endTime)) {
      alert('Wypełnij wszystkie wymagane pola dla spektaklu');
      return;
    }

    // TODO: Implement event creation logic
    console.log('Selected events:', selectedEvents);
    console.log('Spektakl data:', spektaklData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Nowe wydarzenie</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Wybierz terminy</h3>
              
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Szukaj terminów..."
                      value={filters.search}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, search: e.target.value }));
                        if (showFilters) setShowFilters(false);
                      }}
                      className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showFilters ? 'bg-red-100 text-red-800' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>

                {showFilters && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-slide-down">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Wszystkie statusy</option>
                          {Object.entries(EVENT_STATUSES).map(([value, info]) => (
                            <option key={value} value={value}>{info.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          value={filters.calendar}
                          onChange={(e) => setFilters(prev => ({ ...prev, calendar: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Wszystkie kalendarze</option>
                          {uniqueCalendars.map(calendar => (
                            <option key={calendar} value={calendar}>{calendar}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <select
                          value={filters.voivodeship}
                          onChange={(e) => setFilters(prev => ({ ...prev, voivodeship: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        >
                          <option value="">Wszystkie województwa</option>
                          {uniqueVoivodeships.map(voivodeship => (
                            <option key={voivodeship} value={voivodeship}>{voivodeship}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>

                      <div>
                        <input
                          type="date"
                          value={filters.endDate}
                          min={filters.startDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {Object.values(filters).some(Boolean) && (
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg text-xs">
                    <span className="text-sm text-gray-600">
                      Aktywne filtry: {Object.values(filters).filter(Boolean).length}
                    </span>
                    <button
                      onClick={() => setFilters({
                        search: '',
                        status: '',
                        calendar: '',
                        startDate: '',
                        endDate: '',
                        voivodeship: ''
                      })}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Wyczyść filtry
                    </button>
                  </div>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        <input 
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvents(filteredEvents);
                            } else {
                              setSelectedEvents([]);
                            }
                          }}
                          checked={selectedEvents.length === filteredEvents.length}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Kalendarz</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Miasto</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input 
                            type="checkbox"
                            checked={selectedEvents.some(e => e.id === event.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEvents([...selectedEvents, event]);
                              } else {
                                setSelectedEvents(selectedEvents.filter(e => e.id !== event.id));
                              }
                            }}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(event.date).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{event.calendarName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {event.city ? `${event.city.name}, ${event.city.voivodeship}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showSpektaklSection}
                  onChange={(e) => setShowSpektaklSection(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Dodaj spektakl</span>
              </label>
            </div>

            {showSpektaklSection && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Spektakl</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tytuł spektaklu *
                  </label>
                  <input
                    type="text"
                    value={spektaklData.title}
                    onChange={(e) => setSpektaklData({...spektaklData, title: e.target.value})}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    required={showSpektaklSection}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Godzina rozpoczęcia *
                    </label>
                    <input
                      type="time"
                      value={spektaklData.startTime}
                      onChange={(e) => setSpektaklData({...spektaklData, startTime: e.target.value})}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                      required={showSpektaklSection}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Godzina zakończenia *
                    </label>
                    <input
                      type="time"
                      value={spektaklData.endTime}
                      onChange={(e) => setSpektaklData({...spektaklData, endTime: e.target.value})}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                      required={showSpektaklSection}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Uwagi
                  </label>
                  <textarea
                    value={spektaklData.notes}
                    onChange={(e) => setSpektaklData({...spektaklData, notes: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-900 border border-transparent rounded-lg hover:bg-red-800"
              >
                Utwórz wydarzenie
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;