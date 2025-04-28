import React from 'react';
import { Calendar } from 'lucide-react';

interface WeekendToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const WeekendToggle: React.FC<WeekendToggleProps> = ({ isEnabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`p-1.5 rounded-lg transition-colors flex items-center space-x-1
        ${isEnabled ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
      title={isEnabled ? 'Wyłącz weekendy' : 'Włącz weekendy'}
    >
      <Calendar className="w-3.5 h-3.5" />
    </button>
  );
};

export default WeekendToggle;