import React from 'react';
import { Bell, X } from 'lucide-react';
import { CalendarEvent, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

const formatNotificationDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  return formatDate(localDate);
};

interface TransferInitialNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  event: CalendarEvent;
  fromUser: User;
}

const TransferInitialNotification: React.FC<TransferInitialNotificationProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
  event,
  fromUser,
}) => {
  if (!isOpen || !event || !fromUser || event.status === 'przekazany') return null;

  return (
    <div className="bg-white rounded-lg shadow-xl border border-red-200 overflow-hidden">
      <div className="modal-header">
        <div className="flex items-center space-x-2">
          <Bell className="w-6 h-6 text-white animate-notification-bell" />
          <h3 className="text-lg font-semibold text-white">
            Nowa prośba o przekazanie terminu
          </h3>
        </div>
        <button
          onClick={onClose}
          className="btn-modal-close absolute top-4 right-4"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
        
      <div className="p-6 space-y-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-base text-red-800">
            <span className="font-medium">{fromUser.name}</span> chce przekazać Ci termin z dnia{' '}
            <span className="font-medium">{formatNotificationDate(event.date)}</span>.
            {event.city && (
              <span className="block mt-2 text-red-700 font-medium">
                Miasto: {event.city.name} ({event.city.voivodeship})
              </span>
            )}
          </p>
        </div>
      
        <div className="flex justify-end space-x-3">
          <button
            onClick={onReject}
            className="px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Odrzuć
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 text-base bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors font-medium shadow-md"
          >
            Przyjmij termin
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferInitialNotification;