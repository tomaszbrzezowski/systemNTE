import React from 'react';
import { X, AlertCircle, User } from 'lucide-react';
import { User as UserType, CalendarEvent } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface TakeoverConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentUser: UserType;
  event: CalendarEvent;
  date: Date;
}

const TakeoverConfirmationModal: React.FC<TakeoverConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentUser,
  event,
  date
}) => {
  if (!isOpen) return null;
  const isOwnEvent = event.userId === currentUser.id;

  // Don't show modal for own events
  if (isOwnEvent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Potwierdź przejęcie terminu
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <span className="font-medium text-purple-900">
                  {currentUser.name}
                </span>
                <p className="text-sm text-purple-700 mt-1">
                  Termin: {formatDate(date)}
                </p>
                <p className="text-sm text-purple-600 mt-2">
                  Ten termin jest dostępny do przejęcia. Po potwierdzeniu termin zostanie od razu przypisany do Ciebie.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Tak, przejmij termin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeoverConfirmationModal;