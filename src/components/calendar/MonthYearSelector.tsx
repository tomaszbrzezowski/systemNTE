import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { translations } from '../../utils/translations';

interface MonthYearSelectorProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
}

const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  currentDate,
  onMonthChange,
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
    <div className="flex items-center justify-between bg-white rounded-lg shadow-md px-6 py-4">
      <button
        onClick={handlePreviousMonth}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="text-xl font-semibold text-gray-800">
        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
      </div>
      
      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MonthYearSelector;