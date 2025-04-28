import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User } from '../../types';

interface TransferNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  fromUser: User;
  date: Date;
}

const TransferNotificationModal: React.FC<TransferNotificationModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
  fromUser,
  date
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const handleAcceptClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmAccept = () => {
    onAccept();
    onClose();
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Nowa prośba o przejęcie terminu
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
          {!showConfirmation ? (
            <>
              <p className="text-gray-600">
                Użytkownik <span className="font-medium">{fromUser.name}</span> chce przekazać Ci termin na dzień{' '}
                <span className="font-medium">{formatDate(date)}</span>.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Odrzuć
                </button>
                <button
                  onClick={handleAcceptClick}
                  className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  Przyjmij termin
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  Czy na pewno chcesz przejąć ten termin?
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Po potwierdzeniu termin zostanie przypisany do Ciebie i będziesz za niego odpowiedzialny.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleConfirmAccept}
                  className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  Potwierdzam
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferNotificationModal;