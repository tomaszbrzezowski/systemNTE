import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import EventSettingsModal from '../events/EventSettings';

const DockMenu: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  
  const handleSpectaclesClick = () => {
    setShowSettings(true);
  };

  return (
    <div className="fixed left-0 top-16 bottom-0 w-16 bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center py-4 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] border-r border-gray-300 z-40">
      <div className="flex-1 flex flex-col items-center">
        {currentUser?.role === 'administrator' && (
          <button
            onClick={handleSpectaclesClick}
            className="relative group p-2 rounded-lg transition-all duration-200 hover:bg-red-900/10 hover:scale-110 hover:shadow-lg mt-auto"
          >
            <div className="text-gray-700 transition-all duration-200 group-hover:text-red-900">
              <Settings className="w-5 h-5" />
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-red-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 shadow-lg">
              Spektakle
            </div>
          </button>
        )}
      </div>
      <EventSettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default DockMenu;