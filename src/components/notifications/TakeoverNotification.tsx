import React from 'react';
import { Bell, X } from 'lucide-react';
import { CalendarEvent, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

const formatNotificationDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  return formatDate(localDate);
};

interface TakeoverNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTransfers: () => void;
  pendingTransfers: CalendarEvent[];
  users: User[];
}

const TakeoverNotification: React.FC<TakeoverNotificationProps> = ({
  isOpen,
  onClose,
  onViewTransfers,
  pendingTransfers,
  users
}) => {
  if (!isOpen || pendingTransfers.length === 0) return null;

  const getFromUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Nieznany użytkownik';
  };

  return (
    <div className="fixed top-0 right-0 m-4 max-w-sm w-full z-50 animate-slide-in">
      <div className="bg-white rounded-lg shadow-lg border border-purple-200 overflow-hidden">
        <div className="bg-purple-50 p-4 flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-purple-800">
              Nowe powiadomienia ({pendingTransfers.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors group"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-purple-600 group-hover:text-purple-800 transition-colors" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {pendingTransfers.slice(0, 3).map(event => (
            <div key={event.id} className="text-sm">
              <p className="text-gray-800">
                <span className="font-medium">{getFromUserName(event.userId)}</span>
                {' '}chce przekazać Ci termin z dnia{' '}
                <span className="font-medium">{formatNotificationDate(event.date)}</span>
              </p>
            </div>
          ))}
          
          {pendingTransfers.length > 3 && (
            <p className="text-sm text-gray-600">
              ...i {pendingTransfers.length - 3} więcej
            </p>
          )}
          
          <button
            onClick={onViewTransfers}
            className="w-full mt-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            Zobacz wszystkie
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeoverNotification;