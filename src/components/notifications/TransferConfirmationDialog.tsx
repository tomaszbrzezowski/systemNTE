import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface TransferConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'accept' | 'reject';
  date: Date;
  fromUserName: string;
}

const TransferConfirmationDialog: React.FC<TransferConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  date,
  fromUserName
}) => {
  if (!isOpen) return null;

  const isAccept = action === 'accept';
  const title = isAccept ? 'Potwierdź przyjęcie terminu' : 'Potwierdź odrzucenie terminu';
  const message = isAccept
    ? `Czy na pewno chcesz przyjąć termin z dnia ${formatDate(date)} od użytkownika ${fromUserName}?`
    : `Czy na pewno chcesz odrzucić termin z dnia ${formatDate(date)} od użytkownika ${fromUserName}?`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className={`w-6 h-6 ${isAccept ? 'text-green-500' : 'text-red-500'}`} />
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-600">{message}</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isAccept 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isAccept ? 'Tak, przyjmij' : 'Tak, odrzuć'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferConfirmationDialog;