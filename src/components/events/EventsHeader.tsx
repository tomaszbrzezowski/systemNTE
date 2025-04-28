import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import EventSettingsModal from '../events/EventSettings';

interface EventsHeaderProps {
  title: string;
}

const EventsHeader: React.FC<EventsHeaderProps> = ({ title }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">NARODOWY TEATR EDUKACJI</h1>
              <span className="text-sm text-white/70 font-medium tracking-wide uppercase">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="border-l border-white/20 pl-4 flex items-center space-x-4">
              <div>
                <div className="text-sm font-medium">{currentUser?.name}</div>
                <div className="text-xs text-white/70">{currentUser?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Wyloguj"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default EventsHeader;