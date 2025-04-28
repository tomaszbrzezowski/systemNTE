import React from 'react';
import { X, User } from 'lucide-react';
import { City, User as UserType } from '../../types';

interface AssignedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City;
  assignedUsers: UserType[];
}

const AssignedUsersModal: React.FC<AssignedUsersModalProps> = ({
  isOpen,
  onClose,
  city,
  assignedUsers,
}) => {
  if (!isOpen) return null;

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      administrator: 'bg-red-100 text-red-800',
      supervisor: 'bg-blue-100 text-blue-800',
      organizator: 'bg-green-100 text-green-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Przypisani użytkownicy
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {city.name}, {city.voivodeship}
              </p>
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
          {assignedUsers.length > 0 ? (
            <div className="space-y-3">
              {assignedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Brak przypisanych użytkowników
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedUsersModal;