import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, PlusSquare, User, Building2, LogOut, MapPin, CalendarDays, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../utils/translations';
import DateNavigation from './DateNavigation';
import IconButton from './IconButton';
import MapView from '../map/MapView';
import { Calendar, City } from '../../types';
import { getUsers } from '../../services/auth';

interface DesktopNavProps {
  onAddCalendarClick: () => void;
  onShowTransfers: () => void;
  onUserClick: () => void;
  onCityClick: () => void;
  onLogout: () => void;
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  onDateSelect: () => void;
  userRole?: string;
  pendingTransfersCount?: number;
  calendars: Calendar[];
  cities: City[];
}

const DesktopNav: React.FC<DesktopNavProps> = (props) => {
  const { currentUser } = useAuth();
  const t = translations.pl.header;
  const [showMapView, setShowMapView] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const loadedUsers = await getUsers();
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };

    if (showMapView) {
      loadUsers();
    }
  }, [showMapView]);

  return (
    <div className="hidden lg:flex items-center justify-between py-3">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">{t.title}</h1>
          <span className="hidden lg:block text-sm text-white/70 font-medium tracking-wide uppercase">
            Kalendarz
          </span>
        </div>
        <DateNavigation
          currentDate={props.currentDate}
          onDateSelect={props.onDateSelect}
          onMonthChange={props.onMonthChange}
        />
      </div>

      {currentUser && (
        <div className="flex items-center space-x-4">
          <div className="border-r border-white/20 pr-4 mr-2">
            <div className="text-sm font-medium text-white">{currentUser.name}</div>
            <div className="text-xs text-white/70 capitalize">{currentUser.role}</div>
          </div>

          <IconButton
            Icon={Bell}
            onClick={props.onShowTransfers}
            label="Powiadomienia"
            badge={props.pendingTransfersCount}
            animation="pulse"
          />

          {props.userRole === 'administrator' && (
            <>
              <IconButton
                Icon={PlusSquare}
                onClick={props.onAddCalendarClick}
                label="Dodaj kalendarz"
                animation="bounce"
              />
              <IconButton
                Icon={User}
                onClick={props.onUserClick}
                label="Użytkownicy"
              />
              <IconButton
                Icon={Building2}
                onClick={props.onCityClick}
                label="Miasta"
              />
              <Link
                to="/events"
                className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
              >
                <CalendarDays className="w-5 h-5" />
                <span>Wydarzenia</span>
              </Link>
            </>
          )}
          <button
            onClick={() => setShowMapView(true)}
            className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
          >
            <MapPin className="w-5 h-5" />
            <span>Mapa</span>
          </button>
          
          <IconButton
            Icon={LogOut}
            onClick={props.onLogout}
            label="Wyloguj"
          />
        </div>
      )}
      {showMapView && (
        <MapView
          calendars={props.calendars}
          cities={props.cities}
          users={users}
          onClose={() => setShowMapView(false)}
        />
      )}
    </div>
  );
};

export default DesktopNav;