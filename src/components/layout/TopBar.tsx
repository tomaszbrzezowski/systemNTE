import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EventSettingsModal from '../events/EventSettings';
import SingleSmsForm from '../notifications/SingleSmsForm';
import * as Icons from 'lucide-react';

const TopBar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSmsForm, setShowSmsForm] = useState(false);

  const menuItems = [
    { icon: Icons.Calendar, label: 'Kalendarz', path: '/', color: 'text-blue-600' },
    { icon: React.memo(Icons.Building2), label: 'Sale', path: '/events/halls', color: 'text-green-600' },
    { icon: Icons.FileText, label: 'Umowy', path: '/events/agreements', color: 'text-amber-600' },
    { icon: Icons.CalendarDays, label: 'Wydarzenia', path: '/events', color: 'text-purple-600' },
    { icon: Icons.Users, label: 'Klienci', path: '/events/clients', color: 'text-red-600' }
  ];

  return (
    <div className="bg-gradient-to-r from-red-900 to-red-800 border-b border-red-950/20">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between px-4 h-16 relative">
          {/* Logo and title */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h1 className="text-lg font-bold text-white">
              <span className="hidden sm:inline">NARODOWY TEATR EDUKACJI</span>
              <span className="sm:hidden">NTE</span>
            </h1>
            <div className="h-6 w-px bg-white/20" />
            <span className="text-sm text-white/70 font-medium">
              System wydarzeń
            </span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3 py-2 rounded-lg transition-all duration-200 group ${
                  location.pathname === item.path 
                    ? 'text-white bg-white/20' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5">
                    <item.icon />
                  </div>
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </div>
                {location.pathname === item.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </Link>
            ))}

            {currentUser?.role === 'administrator' && (
              <button
                onClick={() => setShowSmsForm(true)}
                className="px-3 py-2 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center space-x-2">
                  <Icons.MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-medium">Wyślij SMS</span>
                </div>
              </button>
            )}

            {currentUser?.role === 'administrator' && (
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-2 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10"
              >
                <div className="flex items-center space-x-2">
                  <Icons.Settings className="w-5 h-5" />
                  <span className="text-sm font-medium">Spektakle</span>
                </div>
              </button>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {currentUser?.name}
              </div>
              <div className="text-xs text-white/70">
                {currentUser?.role}
              </div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <button
              onClick={() => logout()}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Wyloguj"
            >
              <Icons.LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mobile menu button */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setShowFilters(false); // Always close filters when toggling mobile menu
            }}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
          >
            <Icons.Menu className="w-6 h-6" />
          </button>

          {/* Mobile menu */}
          <div className={`fixed top-16 right-0 left-0 bottom-0 bg-red-800 shadow-lg md:hidden transform transition-transform duration-300 ease-in-out z-50 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
              <div className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${
                      location.pathname === item.path
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
          </div>
        </div>
        <EventSettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
        <SingleSmsForm
          isOpen={showSmsForm}
          onClose={() => setShowSmsForm(false)}
        />
      </div>
    </div>
  );
};

export default TopBar;