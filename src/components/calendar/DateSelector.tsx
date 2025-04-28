import React, { useState } from 'react';
import { translations } from '../../utils/translations';

interface DateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  isOpen,
  onClose,
  currentDate,
  onDateSelect,
}) => {
  const months = translations.pl.calendar.months;
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onDateSelect(selectedDate);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center pt-20 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 w-80 border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="grid grid-cols-3 gap-3">
          {months.map((month, index) => (
            <button
              key={month}
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(index);
                setSelectedDate(newDate);
              }}
              className={`p-2.5 rounded-lg text-sm font-medium transition-all border border-gray-300 text-center flex items-center justify-center ${
                selectedDate.getMonth() === index
                  ? 'bg-red-900 text-white shadow-md'
                  : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
              }`}
            >
              {month}
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-gray-200 pt-5">
          <div className="grid grid-cols-3 gap-3">
            {years.map(year => (
              <button
                key={year}
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(year);
                  setSelectedDate(newDate);
                }}
                className={`p-2.5 rounded-lg text-sm font-medium transition-all border border-gray-300 text-center flex items-center justify-center ${
                  selectedDate.getFullYear() === year
                    ? 'bg-red-900 text-white shadow-md'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg"
          >
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors border border-gray-300"
          >
            Potwierdź
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;