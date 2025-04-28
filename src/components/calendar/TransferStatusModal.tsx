import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User } from '../../types';

interface TransferStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => void;
  users: User[];
  currentUser: User;
}

const TransferStatusModal: React.FC<TransferStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  users,
  currentUser
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  if (!isOpen) return null;

  const availableUsers = users.filter(user => user.id !== currentUser.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Wybierz osobę do przekazania
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

        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-600">
              Wybierz osobę, której chcesz przekazać termin:
            </p>
            <div className="space-y-2">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onConfirm(user.id)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferStatusModal;