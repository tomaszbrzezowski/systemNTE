import React from 'react';
import { AlertCircle } from 'lucide-react';
import { User } from '../../types';

interface TransferConfirmationAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromUser: User;
  toUser: User;
  date: Date;
}

const TransferConfirmationAlert: React.FC<TransferConfirmationAlertProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fromUser,
  toUser,
  date
}) => {
  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              Potwierdź przekazanie terminu
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Czy na pewno chcesz przekazać termin z dnia{' '}
              <span className="font-medium">{formatDate(date)}</span> dla użytkownika{' '}
              <span className="font-medium">{toUser.name}</span>?
            </p>
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
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Potwierdź przekazanie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferConfirmationAlert;