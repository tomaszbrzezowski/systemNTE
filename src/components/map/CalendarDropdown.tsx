import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Calendar as CalendarType } from '../../types';

interface CalendarDropdownProps {
  calendars: CalendarType[];
  selectedCalendarIds: string[];
  onCalendarChange: (calendarIds: string[]) => void;
}

const CalendarDropdown: React.FC<CalendarDropdownProps> = ({
  calendars,
  selectedCalendarIds,
  onCalendarChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCalendarToggle = (calendarId: string) => {
    const newSelectedIds = selectedCalendarIds.includes(calendarId)
      ? selectedCalendarIds.filter(id => id !== calendarId)
      : [...selectedCalendarIds, calendarId];
    onCalendarChange(newSelectedIds);
  };

  const selectedCount = selectedCalendarIds.length;
  const displayText = selectedCount === 0 
    ? 'Wybierz kalendarze'
    : selectedCount === calendars.length
    ? 'Wszystkie kalendarze'
    : `Wybrane kalendarze (${selectedCount})`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/20 text-white border border-white/30 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-white/40 focus:border-transparent min-w-[180px] hover:bg-white/30 transition-colors"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-black/80 border border-white/30 rounded-lg shadow-lg overflow-hidden z-10">
          <div className="max-h-[240px] overflow-y-auto">
            {calendars.map(calendar => (
              <label
                key={calendar.id}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/10 cursor-pointer text-white transition-colors border-b border-white/10 last:border-b-0"
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCalendarIds.includes(calendar.id)}
                    onChange={() => handleCalendarToggle(calendar.id)}
                    className="opacity-0 absolute h-3.5 w-3.5 cursor-pointer"
                  />
                  <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${
                    selectedCalendarIds.includes(calendar.id)
                      ? 'bg-red-600 border-red-600 shadow-sm'
                      : 'border-white/50 hover:border-white'
                  }`}>
                    {selectedCalendarIds.includes(calendar.id) && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                </div>
                <span className="flex-1 text-xs font-medium">{calendar.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarDropdown;