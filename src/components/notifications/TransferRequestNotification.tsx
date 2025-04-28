import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { CalendarEvent, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

const formatNotificationDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Create new date object with time set to midnight UTC
  const localDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  return formatDate(localDate);
};

interface TransferRequestNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  event: CalendarEvent;
  fromUser: User;
}

const TransferRequestNotification: React.FC<TransferRequestNotificationProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
  event,
  fromUser,
}) => {

  // Don't show notification if event is already transferred
  if (!isOpen || !event || !fromUser || event.status === 'przekazany') return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="w-[480px] animate-notification-slide shadow-2xl">
      <div className="bg-white rounded-lg shadow-xl border border-purple-200 overflow-hidden transform transition-all hover:scale-[1.02]">
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-5 flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-white animate-notification-bell" />
            <h3 className="text-lg font-semibold text-white">
              Nowa prośba o przejęcie terminu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-base text-purple-800">
              <span className="font-medium">{fromUser.name}</span> chce przekazać Ci termin z dnia{' '}
              <span className="font-medium">{formatNotificationDate(event.date)}</span>.
              {event.city && (
                <span className="block mt-2 text-purple-700 font-medium">
                  Miasto: {event.city.name} ({event.city.voivodeship})
                </span>
              )}
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onReject}
              className="px-4 py-2 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium"
            >
              Odrzuć
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 text-base bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors font-medium shadow-md"
            >
              Przyjmij termin
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default TransferRequestNotification;