import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { User as UserType } from '../../types';

interface TransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (toUserId: string) => void;
  availableUsers: UserType[];
  currentUser: UserType | null;
}

const TransferRequestModal: React.FC<TransferRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableUsers,
  currentUser
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      onSubmit(selectedUserId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Przekaż termin innemu użytkownikowi
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wybierz użytkownika:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Wybierz użytkownika</option>
              {availableUsers
                .filter(user => user.id !== currentUser?.id)
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
              disabled={!selectedUserId}
            >
              Przekaż termin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferRequestModal;