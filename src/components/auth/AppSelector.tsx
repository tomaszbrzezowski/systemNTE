import React from 'react';

interface AppSelectorProps {
  selectedApp: 'calendar' | 'events' | null;
  onAppSelect: (app: 'calendar' | 'events') => void;
}

const AppSelector: React.FC<AppSelectorProps> = ({ selectedApp, onAppSelect }) => {
  return (
    <div className="flex justify-center gap-2 sm:gap-4 mt-2 sm:mt-4 mb-2">
      <button
        type="button"
        onClick={() => onAppSelect('calendar')}
        className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
          selectedApp === 'calendar' 
            ? 'bg-white/30 ring-2 ring-white/50' 
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        Kalendarz NTE
      </button>
      <button
        type="button"
        onClick={() => onAppSelect('events')}
        className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
          selectedApp === 'events' 
            ? 'bg-white/30 ring-2 ring-white/50' 
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        System wydarzeń
      </button>
    </div>
  );
};

export default AppSelector; 