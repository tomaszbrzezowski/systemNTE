import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, LogOut, X, MapPin, CalendarDays } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onUserClick: () => void;
  onCityClick: () => void;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  userRole,
  onUserClick,
  onCityClick,
  onLogout
}) => {
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 w-[85vw] max-w-[320px] bg-gradient-to-b from-red-900 to-red-800 shadow-xl transform transition-transform duration-300 ease-out">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              aria-label="Close menu"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="px-4 py-3 bg-white/10 rounded-lg mb-4">
            <div className="text-sm font-medium text-white break-words">{currentUser?.name}</div>
            <div className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block bg-white/20">
              {userRole}
            </div>
          </div>
          <div className="space-y-1">
            {userRole === 'administrator' && (
              <>
                <button 
                  onClick={() => {
                    onUserClick();
                    onClose();
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-white/10 rounded-lg text-white"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">Użytkownicy</span>
                </button>

                <button 
                  onClick={() => {
                    onCityClick();
                    onClose();
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-white/10 rounded-lg text-white"
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm">Miasta</span>
                </button>
              </>
            )}

            {userRole === 'administrator' && (
              <>
                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('showMapView'));
                    onClose();
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-white/10 rounded-lg text-white"
                >
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">Mapa</span>
                </button>
                <Link
                  to="/events"
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-white/10 rounded-lg text-white"
                >
                  <CalendarDays className="w-5 h-5" />
                  <span className="text-sm">Wydarzenia</span>
                </Link>
              </>
            )}

            <div className="border-t border-red-700/50 mt-4 pt-4">
              <button 
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-white/10 rounded-lg text-white"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Wyloguj</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;