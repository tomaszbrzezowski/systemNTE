import React from 'react';
import { X } from 'lucide-react';
import { User } from '../../types';

interface TransferUserSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (userId: string) => void;
  users: User[];
  title: string;
}

const TransferUserSelector: React.FC<TransferUserSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  users,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-2">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => onSelect(user.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-500 transition-colors"
              >
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.role}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferUserSelector;