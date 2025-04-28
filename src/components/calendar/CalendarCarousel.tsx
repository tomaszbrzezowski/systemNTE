import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarGrid from './CalendarGrid';
import { Calendar, CalendarEvent, User, City } from '../../types';

interface CalendarCarouselProps {
  calendars: Calendar[];
  currentDate: Date;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEditCalendar: (calendar: Calendar) => void;
  onDeleteCalendar: (calendar: Calendar) => void;
  onUpdateEvent: (calendarId: string, dates: Date[], event: Partial<CalendarEvent>) => void;
  users: User[];
  cities: City[];
}

const CalendarCarousel: React.FC<CalendarCarouselProps> = ({
  calendars,
  currentDate,
  currentPage,
  onPageChange,
  onEditCalendar,
  onDeleteCalendar,
  onUpdateEvent,
  users,
  cities,
}) => {
  const totalPages = Math.ceil(calendars.length / 4);
  const startIndex = currentPage * 4;
  const visibleCalendars = calendars.slice(startIndex, startIndex + 4);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="relative">
      {totalPages > 1 && (
        <>
          {/* Desktop navigation buttons */}
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all z-10 group"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all z-10 group"
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gray-900 transition-colors" />
          </button>

          {/* Mobile top navigation buttons */}
          <div className="lg:hidden flex justify-between items-center mb-4 px-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-50 flex items-start justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-start space-x-3">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => onPageChange(index)}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    currentPage === index ? 'bg-red-900' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-50 flex items-start justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
      
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 auto-rows-fr">
          {visibleCalendars.map((calendar) => (
            <CalendarGrid
              key={calendar.id}
              calendar={calendar}
              currentDate={currentDate}
              onEdit={onEditCalendar}
              onDelete={onDeleteCalendar}
              onUpdateEvent={onUpdateEvent}
              users={users}
              cities={cities}
            />
          ))}
        </div>
      </div>

      {/* Mobile bottom pagination dots */}
      {totalPages > 1 && (
        <div className="lg:hidden flex justify-between items-center mt-4 px-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-50 flex items-start justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-start space-x-3">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={`page-dot-${index}`}
                onClick={() => onPageChange(index)}
                className={`w-4 h-4 rounded-full transition-colors ${
                  currentPage === index ? 'bg-red-900' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="p-2 bg-white rounded-lg shadow-sm disabled:opacity-50 flex items-start justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarCarousel;