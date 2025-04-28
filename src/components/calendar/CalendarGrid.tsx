import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Calendar, CalendarEvent, User, City } from '../../types';
import { isHoliday } from '../../utils/holidayUtils';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import WeekendToggle from './WeekendToggle';
import DayEventModal from './DayEventModal';
import TransferAcceptanceModal from './TransferAcceptanceModal';
import TakeoverAcceptanceModal from './TakeoverAcceptanceModal';
import CalendarRow from './CalendarRow';

interface CalendarGridProps {
  calendar: Calendar;
  currentDate: Date;
  onEdit: (calendar: Calendar) => void;
  onDelete: (calendar: Calendar) => void;
  onUpdateEvent: (calendarId: string, dates: Date[], event: Partial<CalendarEvent>) => void;
  users: User[];
  cities: City[];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendar,
  currentDate,
  onEdit,
  onDelete,
  onUpdateEvent,
  users,
  cities,
}) => {
  const { currentUser } = useAuth();
  const permissions = usePermissions(currentUser);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [firstSelectedDate, setFirstSelectedDate] = useState<Date | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [enableWeekends, setEnableWeekends] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectionStartDate, setSelectionStartDate] = useState<Date | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventForDay = (day: number): CalendarEvent | undefined => {
    const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    const dateStr = date.toISOString().split('T')[0];
    return calendar.events.find(event => 
      new Date(event.date).toISOString().split('T')[0] === dateStr
    );
  };

  const handleDayClick = (day: number) => {
    if (!currentUser) return;
    
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const existingEvent = getEventForDay(day);
    const isWeekendDay = isHoliday(clickedDate);
    
    // Handle accepting przekazywany events
    if (existingEvent?.status === 'przekazywany' && existingEvent.toUserId === currentUser.id) {
      setSelectedDates([clickedDate]);
      setSelectedEvent(existingEvent);
      setShowTransferModal(true);
      return;
    }

    // Handle takeover confirmation
    if (existingEvent?.status === 'do_przejęcia') {
      setSelectedDates([clickedDate]);
      setSelectedEvent(existingEvent);
      setShowTakeoverModal(true);
      return;
    }
    
    // Prevent taking over own events
    if (existingEvent?.status === 'do_przejęcia' && existingEvent.userId === currentUser.id) {
      return;
    }

    // For non-admin users, prevent editing certain statuses
    if (!permissions.isAdmin && existingEvent && (
        existingEvent.status === 'niewydany' || 
        existingEvent.status === 'wolne' ||
        existingEvent.status === 'przekazywany'
    )) {
      return;
    }
    
    // For non-admin users, immediately show modal with single date
    if (currentUser.role !== 'administrator') {
      // Allow clicking on do_przejecia events for all users
      if (existingEvent?.status === 'do_przejęcia') {
        setSelectedDates([clickedDate]);
        setSelectedEvent(existingEvent);
        setShowTakeoverModal(true);
        return;
      }
      
      if (isWeekendDay && !enableWeekends && !existingEvent) {
        return;
      }

      setSelectedDates([clickedDate]);
      setSelectedEvent(existingEvent || null);
      setShowModal(true);
      return;
    }
    
    // Allow clicking on do_przejecia events for all users
    if (existingEvent?.status === 'do_przejęcia') {
      setSelectedDates([clickedDate]);
      setSelectedEvent(existingEvent);
      setShowTakeoverModal(true);
      return;
    }
    
    if (isWeekendDay && !enableWeekends && !existingEvent) {
      return;
    }

    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedDates([clickedDate]);
      setFirstSelectedDate(clickedDate);
      setSelectedEvent(existingEvent || null);
      setSelectionStartDate(clickedDate);
      setRangeStart(clickedDate);
      return;
    }

    if (selectionStartDate) {
      const dateRange = getDatesBetween(selectionStartDate, clickedDate);
      setIsSelecting(false);
      setSelectedDates(dateRange);
      setSelectedEvent(existingEvent || null);
      setRangeStart(null);
      setSelectionStartDate(null);
      setFirstSelectedDate(null);
      setShowModal(true);
    }
  };

  const handleDayHover = (day: number) => {
    // Only allow hover selection for administrators
    if (currentUser.role !== 'administrator') return;
    
    if (!isSelecting || !selectionStartDate) return;
    
    const hoverDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateRange = getDatesBetween(selectionStartDate, hoverDate);
    setSelectedDates(dateRange);
  };

  const getDatesBetween = (start: Date, end: Date): Date[] => {
    const dates: Date[] = [];
    const current = new Date(Math.min(start.getTime(), end.getTime()));
    const endDate = new Date(Math.max(start.getTime(), end.getTime()));

    while (current <= endDate) {
      const isWeekendDay = isHoliday(current);
      if (!isWeekendDay || enableWeekends) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const handleTakeoverConfirm = () => {
    if (selectedEvent && selectedDates.length > 0 && currentUser) {
      onUpdateEvent(calendar.id, selectedDates, {
        status: 'przekazany',
        userId: currentUser.id,
        city: null,
        previousUserId: selectedEvent.userId,
        toUserId: null
      });
      
      setShowTakeoverModal(false);
      setSelectedEvent(null);
      setSelectedDates([]);
      setRangeStart(null);
    }
  };

  const handleAcceptTransfer = () => {
    if (selectedEvent && selectedDates.length > 0 && currentUser) {
      // Dispatch event to clear notification
      window.dispatchEvent(new CustomEvent('clearNotification', { detail: selectedEvent.id }));

      onUpdateEvent(calendar.id, selectedDates, {
        status: 'przekazany',
        userId: currentUser.id,
        city: null,
        previousUserId: selectedEvent.userId,
        toUserId: null
      });
      
      setShowTransferModal(false);
      setSelectedEvent(null);
      setSelectedDates([]);
    }
  };

  const handleDeclineTransfer = () => {
    if (selectedEvent && selectedDates.length > 0) {
      // Dispatch event to clear notification
      window.dispatchEvent(new CustomEvent('clearNotification', { detail: selectedEvent.id }));

      onUpdateEvent(calendar.id, selectedDates, {
        status: 'wydany',
        userId: selectedEvent.userId,
        city: selectedEvent.city,
        previousUserId: null,
        toUserId: null
      });
      
      setShowTransferModal(false);
      setSelectedEvent(null);
      setSelectedDates([]);
    }
  };

  if (!currentUser) return null;

  const getRowClassName = (date: Date, event?: CalendarEvent) => {
    const isWeekendDay = isHoliday(date);
    const isWolneStatus = event?.status === 'wolne';
    const isNonEditableStatus = !permissions.isAdmin && event && 
      (event.status === 'niewydany' || event.status === 'wolne');
    const isNiewydanyStatus = event?.status === 'niewydany';
    const isFirstSelected = firstSelectedDate && date.getTime() === firstSelectedDate.getTime();
    const isInSelection = selectedDates.some(d => d.getTime() === date.getTime());
    
    if (isWeekendDay || isWolneStatus || isNonEditableStatus) {
      return 'bg-gray-100 border-gray-200';
    }
    
    if (isFirstSelected) {
      return 'bg-red-100 border-red-300';
    }

    if (isInSelection) {
      return 'bg-red-50 border-red-200';
    }
    
    if (isNiewydanyStatus) {
      return 'bg-white border-gray-100';
    }
    
    return 'bg-white border-gray-100 hover:border-red-300';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-red-900 to-red-800 text-white p-2 flex items-center justify-between">
          <h2 className="text-base font-medium">{calendar.name}</h2>
          <div className="flex items-center space-x-1">
            {permissions.isAdmin && (
              <>
                <button 
                  onClick={() => onEdit(calendar)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => onDelete(calendar)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {permissions.isAdmin && (
              <WeekendToggle 
                isEnabled={enableWeekends} 
                onToggle={() => setEnableWeekends(!enableWeekends)} 
              />
            )}
          </div>
        </div>
        
        <div className="p-2 flex-1">
          <div className="grid grid-rows-[repeat(31,minmax(24px,1fr))] gap-0.5">
            {days.map((day) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const event = getEventForDay(day);
              
              return (
                <CalendarRow
                  key={day}
                  day={day}
                  date={date}
                  event={event}
                  users={users}
                  currentUser={currentUser}
                  enableWeekends={enableWeekends}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => handleDayHover(day)}
                  rowClassName={getRowClassName(date, event)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {showModal && selectedDates.length > 0 && (
        <DayEventModal
          isOpen={true}
          onClose={() => {
            setShowModal(false);
            setSelectedDates([]);
            setSelectedEvent(null);
            setRangeStart(null);
          }}
          onSave={(data) => {
            onUpdateEvent(calendar.id, selectedDates, data);
            setShowModal(false);
            setSelectedDay(null);
            setSelectedDates([]);
            setSelectedEvent(null);
            setRangeStart(null);
          }}
          dates={selectedDates.map(d => d.toISOString().split('T')[0])}
          users={users}
          cities={cities}
          currentUser={currentUser}
          currentEvent={selectedEvent}
        />
      )}

      {currentUser && showTakeoverModal && selectedEvent && (
        <TakeoverAcceptanceModal
          isOpen={showTakeoverModal}
          onClose={() => {
            setShowTakeoverModal(false);
            setSelectedEvent(null);
            setSelectedDates([]);
          }}
          onConfirm={handleTakeoverConfirm}
          date={selectedDates[0]}
          fromUser={users.find(u => u.id === selectedEvent.userId)!}
          currentUser={currentUser}
        />
      )}

      {currentUser && showTransferModal && selectedEvent && selectedDates.length > 0 && (
        <TransferAcceptanceModal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedEvent(null);
            setSelectedDates([]);
          }}
          onAccept={handleAcceptTransfer}
          onDecline={handleDeclineTransfer}
          fromUser={users.find(u => u.id === selectedEvent.userId)!}
          date={selectedDates[0]}
        />
      )}
    </div>
  );
};

export default CalendarGrid;