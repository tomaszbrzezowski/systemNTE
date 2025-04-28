import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../utils/translations';
import { Menu, X as CloseIcon, ChevronLeft, ChevronRight, Bell, PlusSquare, LogOut, User, Building2, CalendarClock, CalendarDays, MessageSquare } from 'lucide-react';
import DateSelector from '../calendar/DateSelector';
import MobileMenu from './MobileMenu';
import DesktopNav from './DesktopNav';
import DateNavigation from './DateNavigation';
import IconButton from './IconButton';
import SingleSmsForm from '../notifications/SingleSmsForm';

interface HeaderProps {
  onAddCalendarClick: () => void;
  onShowTransfers: () => void;
  pendingTransfersCount?: number;
  onUserClick: () => void;
  onCityClick: () => void;
  onAssignedDatesClick: () => void;
  onSmsClick: () => void;
  currentDate: Date;
  calendars: Calendar[];
  cities: City[];
  onMonthChange: (date: Date) => void;
  userRole?: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const [showSmsForm, setShowSmsForm] = useState(false);
  const t = translations.pl.header;

  const handleDateSelect = (date: Date) => {
    props.onMonthChange(date);
    setIsDateSelectorOpen(false);
  };

  return (
    <>
    <header className="bg-gradient-to-r from-red-900 to-red-800 text-white shadow-lg">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Header (lg and above) */}
        <DesktopNav 
          {...props} 
          onDateSelect={() => setIsDateSelectorOpen(true)}
          onSmsClick={() => setShowSmsForm(true)}
        />

        {/* Medium Breakpoint Header (md only) */}
        <div className="hidden sm:flex lg:hidden items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold tracking-tight flex flex-col">
              <span className="block">NARODOWY TEATR EDUKACJI</span>
              <span className="text-xs font-normal text-white/70">
                {currentUser?.name} ({currentUser?.role})
              </span>
            </h1>
          </div>

          <div className="flex-1 flex justify-center">
            <DateNavigation
              currentDate={props.currentDate}
              onDateSelect={() => setIsDateSelectorOpen(true)}
              onMonthChange={props.onMonthChange}
            />
          </div>

          <div className="flex items-center space-x-3">
            {currentUser && (
              <>
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
                    />
                  </>
                )}
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
                <IconButton
                  Icon={CalendarClock}
                  onClick={props.onAssignedDatesClick}
                  label="Terminy"
                />
                <IconButton
                  Icon={MessageSquare}
                  onClick={() => setShowSmsForm(true)}
                  label="Wyślij SMS"
                />
                <a
                  href="/events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
                >
                  <CalendarDays className="w-5 h-5" />
                  <span>Wydarzenia</span>
                </a>
                <IconButton
                  Icon={LogOut}
                  onClick={props.onLogout}
                  label="Wyloguj"
                />
              </>
            )}
          </div>
        </div>

        {/* Small Breakpoint Header (sm and below) */}
        <div className="flex sm:hidden items-center justify-between py-2">
          <button
            aria-label="Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors z-20"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center flex-1 px-4">
            <h1 className="text-lg font-bold tracking-tight truncate max-w-full">
              NTE
            </h1>
          </div>

          <div className="flex items-center">
            <DateNavigation
              currentDate={props.currentDate}
              onDateSelect={() => setIsDateSelectorOpen(true)}
              onMonthChange={props.onMonthChange}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          {...props}
        />
      </div>

      <DateSelector
        isOpen={isDateSelectorOpen}
        onClose={() => setIsDateSelectorOpen(false)}
        currentDate={props.currentDate}
        onDateSelect={handleDateSelect}
      />
    </header>
    <SingleSmsForm
      isOpen={showSmsForm}
      onClose={() => setShowSmsForm(false)}
    />
    </>
  );
};

export default Header;