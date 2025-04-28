import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface TakeoverAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  date: Date;
  fromUser: User;
  currentUser: User;
}

const TakeoverAcceptanceModal: React.FC<TakeoverAcceptanceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  date,
  fromUser,
  currentUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-[480px] animate-notification-slide shadow-2xl">
        <div className="bg-white rounded-lg shadow-xl border border-purple-200 overflow-hidden transform transition-all hover:scale-[1.02]">
          <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-5 flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-white" />
              <h2 className="text-lg font-semibold text-white">
                Potwierdź przejęcie terminu
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800">
                <span className="font-medium">{fromUser.name}</span> chce przekazać Ci termin z dnia{' '}
                <span className="font-medium">{formatDate(date)}</span>.
              </p>
              <p className="text-purple-700 text-sm mt-2">
                Po potwierdzeniu termin zostanie od razu przypisany do Ciebie.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors font-medium"
              >
                Anuluj
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors font-medium shadow-md"
              >
                Tak, przejmij termin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TakeoverAcceptanceModal;