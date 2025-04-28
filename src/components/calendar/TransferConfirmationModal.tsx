import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User } from '../../types';

interface TransferConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedUser: User | undefined;
}

const TransferConfirmationModal: React.FC<TransferConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedUser,
}) => {
  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-[480px] animate-notification-slide shadow-2xl">
        <div className="bg-white rounded-lg shadow-xl border border-red-200 overflow-hidden transform transition-all hover:scale-[1.02]">
          <div className="bg-gradient-to-r from-red-900 to-red-800 p-5 flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-white" />
              <h2 className="text-lg font-semibold text-white">
                Potwierdź przekazanie terminu
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
            >
              <X className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                Czy na pewno chcesz przekazać ten termin użytkownikowi {selectedUser.name}?
              </p>
              <p className="text-red-700 text-sm mt-1">
                Po potwierdzeniu użytkownik otrzyma powiadomienie o możliwości przejęcia terminu.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                Anuluj
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors font-medium shadow-md"
              >
                Potwierdź przekazanie
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferConfirmationModal;