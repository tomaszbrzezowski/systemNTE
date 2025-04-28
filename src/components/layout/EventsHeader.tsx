import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const EventsHeader: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 relative">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                <span className="hidden sm:inline">NARODOWY TEATR EDUKACJI</span>
                <span className="sm:hidden">NTE</span>
              </h1>
              <span className="hidden lg:inline text-sm text-white/70 font-medium tracking-wide uppercase">
                Wydarzenia
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
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

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 lg:hidden z-50">
              <div className="p-4">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="font-medium text-gray-900">{currentUser?.name}</div>
                  <div className="text-sm text-gray-600">{currentUser?.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Wyloguj się</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default EventsHeader;