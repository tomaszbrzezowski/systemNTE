import React from 'react';
import { EventStatus } from '../../types';
import { EVENT_STATUSES } from '../../utils/statusConstants';

const CalendarLegend: React.FC = () => {
  const statuses: { value: EventStatus; label: string; color: string }[] = [
    { value: 'wydany', label: 'Wydany', color: 'bg-red-500' },
    { value: 'zrobiony', label: 'Zrobiony', color: 'bg-green-500' },
    { value: 'przekazany', label: 'Przekazany', color: 'bg-yellow-500' },
    { value: 'do_przejęcia', label: 'Do przejęcia', color: 'bg-purple-500' },
    { value: 'waiting', label: 'Oczekuje na przejęcie', color: 'bg-black' },
    { value: 'w_trakcie', label: 'W trakcie', color: 'bg-blue-500' },
    { value: 'wolne', label: 'Wolne', color: 'bg-gray-500' },
    { value: 'niewydany', label: 'Niewydany', color: 'bg-gray-300' },
  ];

  const voivodeships = [
    { abbr: 'DLŚ', name: 'dolnośląskie' },
    { abbr: 'KUJ', name: 'kujawsko-pomorskie' },
    { abbr: 'LBL', name: 'lubelskie' },
    { abbr: 'LBS', name: 'lubuskie' },
    { abbr: 'ŁDZ', name: 'łódzkie' },
    { abbr: 'MAŁ', name: 'małopolskie' },
    { abbr: 'MAZ', name: 'mazowieckie' },
    { abbr: 'OPO', name: 'opolskie' },
    { abbr: 'PDK', name: 'podkarpackie' },
    { abbr: 'PDL', name: 'podlaskie' },
    { abbr: 'POM', name: 'pomorskie' },
    { abbr: 'ŚLĄ', name: 'śląskie' },
    { abbr: 'ŚWK', name: 'świętokrzyskie' },
    { abbr: 'WAR', name: 'warmińsko-mazurskie' },
    { abbr: 'WLK', name: 'wielkopolskie' },
    { abbr: 'ZPO', name: 'zachodniopomorskie' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-8 mt-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Legenda:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-2 gap-y-1">
              {statuses.map(({ value, label, color }) => (
                <div key={value} className="flex items-center space-x-1.5 px-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                  <span className="text-xs text-gray-600 whitespace-nowrap overflow-hidden">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center border-t border-gray-100 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-2 gap-y-1">
              {voivodeships.map(({ abbr, name }) => (
                <div key={abbr} className="flex items-center space-x-1 px-1.5">
                  <span className="text-xs font-medium text-gray-700 w-8 flex-shrink-0">{abbr}</span>
                  <span className="text-xs text-gray-600 whitespace-nowrap overflow-hidden">- {name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarLegend;