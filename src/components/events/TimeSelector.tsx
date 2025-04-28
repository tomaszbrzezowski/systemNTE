import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  value,
  onChange,
  required = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Generate time options from 7:00 to 15:00 with 5-minute intervals
  const generateTimeOptions = () => {
    const options: string[] = [];
    for (let hour = 7; hour <= 15; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        // Stop at 15:00
        if (hour === 15 && minute > 0) break;
        
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const formatTime = (time: string) => {
    return time || 'Wybierz godzinę';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm text-left flex items-center justify-between"
      >
        <span className="text-gray-900">
          {formatTime(value)}
        </span>
        <Clock className="w-5 h-5 text-gray-400" />
      </button>

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          <div className="py-1">
            {timeOptions.map(time => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  onChange(time);
                  setShowDropdown(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-red-50 transition-colors ${
                  value === time ? 'bg-red-100 text-red-900 font-medium' : 'text-gray-900'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSelector;