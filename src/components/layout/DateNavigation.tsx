import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { translations } from '../../utils/translations';

interface DateNavigationProps {
  currentDate: Date;
  onDateSelect: () => void;
  onMonthChange: (date: Date) => void;
}

const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  onDateSelect,
  onMonthChange
}) => {
  const months = translations.pl.calendar.months;

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  return (
    <div className="flex items-center space-x-2">
      <button onClick={handlePreviousMonth} className="menu-button menu-button-rotate">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button 
        onClick={onDateSelect}
        className="px-2 py-1 text-sm font-medium"
      >
        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
      </button>
      <button onClick={handleNextMonth} className="menu-button menu-button-rotate">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DateNavigation;