import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { translations } from '../../utils/translations';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase'; 
import { CalendarEvent, EventStatus } from '../../types';
import { EVENT_STATUSES } from '../../utils/statusConstants';

interface PerformanceDateSelectorProps {
  value: string;
  onChange: (date: string, calendarId?: string) => void;
  required?: boolean;
}

const PerformanceDateSelector: React.FC<PerformanceDateSelectorProps> = ({
  value,
  onChange,
  required = false
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const months = translations.pl.calendar.months;
  const { currentUser } = useAuth();
  const [availableDates, setAvailableDates] = useState<{
    date: Date;
    status: EventStatus;
  }[]>([]);

  const currentDate = value ? new Date(value) : new Date();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [displayedMonth, setDisplayedMonth] = useState(currentDate.getMonth());
  const [displayedYear, setDisplayedYear] = useState(currentDate.getFullYear());
  const [events, setEvents] = useState<{
    id: string;
    date: string;
    status: EventStatus;
    calendar_id: string;
  }[]>([]);

  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!currentUser) return;
      try {
        const { data: events } = await supabase
          .from('calendar_events')
          .select(`
            id,
            date,
            status,
            user_id,
            calendar_id,
            calendars (
              id,
              name
            )
          `)
          .eq('user_id', currentUser.id)
          .order('date', { ascending: true });

        if (events) {
          setEvents(events);
          const dates = events.map(event => ({
            date: new Date(event.date),
            status: event.status as EventStatus
          }));
          setAvailableDates(dates);
        }
      } catch (error) {
        console.error('Failed to load available dates:', error);
      }
    };

    loadAvailableDates();
  }, [currentUser]);

  const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayedYear, displayedMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    if (displayedMonth === 0) {
      setDisplayedMonth(11);
      setDisplayedYear(displayedYear - 1);
    } else {
      setDisplayedMonth(displayedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayedMonth === 11) {
      setDisplayedMonth(0);
      setDisplayedYear(displayedYear + 1);
    } else {
      setDisplayedMonth(displayedMonth + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    // Create date at noon to avoid timezone issues
    const newDate = new Date(displayedYear, displayedMonth, day, 12);
    setSelectedDate(newDate);
    const dateStr = newDate.toISOString().split('T')[0];
    onChange(dateStr);
    setShowCalendar(false);
  };

  const formatDate = (date: Date): string => {
    // Create new date object at noon to avoid timezone issues
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(), 
      date.getDate(),
      12
    );

    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(localDate);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Data
      </label>
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm text-left flex items-center justify-between"
      >
        <span className="text-gray-900">
          {value ? formatDate(new Date(value)) : 'Wybierz datę'}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>

      {showCalendar && (
        <div className="absolute z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 w-[320px]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium">
                {months[displayedMonth]} {displayedYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'].map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-1"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map(day => {
                const date = new Date(displayedYear, displayedMonth, day);
                const isAvailable = availableDates.some(
                  availableDate =>
                    availableDate.date.getDate() === date.getDate() &&
                    availableDate.date.getMonth() === date.getMonth() &&
                    availableDate.date.getFullYear() === date.getFullYear()
                );
                const availableDate = availableDates.find(
                  ad =>
                    ad.date.getDate() === date.getDate() &&
                    ad.date.getMonth() === date.getMonth() &&
                    ad.date.getFullYear() === date.getFullYear()
                );
                const status = availableDate?.status;
                const statusInfo = status ? EVENT_STATUSES[status] : null;
                const isSelected = selectedDate && 
                  date.getDate() === selectedDate.getDate() &&
                  date.getMonth() === selectedDate.getMonth() &&
                  date.getFullYear() === selectedDate.getFullYear();

                const getDateStyle = () => {
                  if (isSelected) {
                    return 'bg-red-900 text-white';
                  }
                  if (statusInfo) {
                    return `${statusInfo.color} text-white hover:opacity-90`;
                  }
                  return 'text-gray-400 bg-gray-100 cursor-not-allowed';
                };

                const handleClick = () => {
                  if (isAvailable) {
                    // Create date at noon to avoid timezone issues
                    const newDate = new Date(displayedYear, displayedMonth, day, 12);
                    setSelectedDate(newDate);
                    const dateStr = newDate.toISOString().split('T')[0];
                    // Find the event and its calendar ID
                    const event = events.find(e => e.date === dateStr);
                    const calendarId = event?.calendar_id;
                    // Pass both date and calendar ID to parent
                    onChange(dateStr, calendarId);
                    setShowCalendar(false);
                  }
                };

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={handleClick}
                    disabled={!isAvailable}
                    className={`text-sm p-2 rounded-lg transition-all ${getDateStyle()}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDateSelector;