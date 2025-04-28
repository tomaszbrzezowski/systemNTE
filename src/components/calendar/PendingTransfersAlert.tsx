import React from 'react';
import { Bell } from 'lucide-react';
import { CalendarEvent, User } from '../../types';

interface PendingTransfersAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (eventId: string) => void;
  onReject: (eventId: string) => void;
  pendingTransfers: CalendarEvent[];
  users: User[];
}

const PendingTransfersAlert: React.FC<PendingTransfersAlertProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
  pendingTransfers,
  users
}) => {
  if (!isOpen || pendingTransfers.length === 0) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getUserName = (userId: string) => {
    return users.find(user => user.id === userId)?.name || 'Nieznany użytkownik';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              Oczekujące prośby o przejęcie terminów
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {pendingTransfers.map(event => (
              <div
                key={event.id}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <p className="text-blue-800 mb-2">
                  Użytkownik <span className="font-medium">{getUserName(event.previousUserId!)}</span>{' '}
                  chce przekazać Ci termin z dnia{' '}
                  <span className="font-medium">{formatDate(event.date)}</span>
                </p>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => onReject(event.id)}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Odrzuć
                  </button>
                  <button
                    onClick={() => onAccept(event.id)}
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Przyjmij termin
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingTransfersAlert;