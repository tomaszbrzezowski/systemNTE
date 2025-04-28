import React, { useState, useEffect } from 'react';
import { X, Plus, Search, MapPin, Users } from 'lucide-react';
import { City, User } from '../../types';
import { getUsers } from '../../services/auth';
import CitiesListModal from './CitiesListModal';
import AddUserModal from './AddUserModal';
import AssignCitiesModal from './AssignCitiesModal';
import AssignOrganizersModal from './AssignOrganizersModal';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  cities: City[];
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  cities,
  onAddUser,
  onUpdateUser,
}) => {
  const { currentUser } = useAuth();
  const permissions = usePermissions(currentUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignOrganizersModal, setShowAssignOrganizersModal] = useState(false);
  const [showCitiesListModal, setShowCitiesListModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const updatedUsers = await getUsers();
      setFilteredUsers(updatedUsers);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  if (!isOpen || !currentUser) return null;

  const handleAssignOrganizers = async (organizerIds: string[]) => {
    if (!selectedUser) return;

    setError(null);
    try {
      await onUpdateUser(selectedUser.id, {
        ...selectedUser,
        organizatorIds: organizerIds
      });

      setShowAssignOrganizersModal(false);
      setSelectedUser(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to assign organizers');
    }
  };

  const handleAssignCities = (cityIds: string[]) => {
    if (selectedUser) {
      setError(null);
      try {
        onUpdateUser(selectedUser.id, { assignedCityIds: cityIds });
        setShowAssignModal(false);
        setSelectedUser(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to assign cities');
      }
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Zarządzanie użytkownikami</h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj użytkowników..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Dodaj użytkownika</span>
            </button>
          </div>
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* User list */}
          <div className="space-y-4"> 
            {loading && (
              <div className="text-center py-8 text-gray-500">
                Ładowanie użytkowników...
              </div>
            )}
            {!loading && filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nie znaleziono użytkowników
              </div>
            )}
            {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-2">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900">{user.name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <p className="text-xs sm:text-sm text-gray-500">{user.email}</p>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowCitiesListModal(true);
                              }}
                              className="inline-flex items-center space-x-1 text-xs sm:text-sm text-red-600 hover:text-red-800 py-1"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>Przypisane miasta ({user.assignedCityIds.length})</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateUser(user.id, { role: e.target.value as User['role'] })}
                           disabled={user.id === currentUser?.id}
                            className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent min-w-[120px]"
                          >
                            <option value="administrator">Administrator</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="organizator">Organizator</option>
                          </select>
                          <button
                            onClick={() => onUpdateUser(user.id, { active: !user.active })}
                           disabled={user.id === currentUser?.id}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                              user.active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                           } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {user.active ? 'Aktywny' : 'Nieaktywny'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors whitespace-nowrap"
                          >
                            Przypisz miasta
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-4">
                        {user.role === 'supervisor' && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowAssignOrganizersModal(true);
                            }}
                            className="inline-flex items-center space-x-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 py-1"
                          >
                            <Users className="w-4 h-4" />
                            <span>Organizatorzy ({user.organizatorIds?.length || 0})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddUser}
      />

      {selectedUser && (
        <>
          <AssignCitiesModal
            isOpen={showAssignModal}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            cities={cities}
            onAssign={handleAssignCities}
          />

          <AssignOrganizersModal
            isOpen={showAssignOrganizersModal}
            onClose={() => {
              setShowAssignOrganizersModal(false);
              setSelectedUser(null);
            }}
            supervisor={selectedUser}
            availableOrganizers={users.filter(u => 
              u.role === 'organizator' && 
              (!u.supervisorId || u.supervisorId === selectedUser.id)
            )}
            onAssign={handleAssignOrganizers}
          />
        </>
      )}
      
      {selectedUser && (
        <CitiesListModal
          isOpen={showCitiesListModal}
          onClose={() => {
            setShowCitiesListModal(false);
            setSelectedUser(null);
          }}
          cities={cities}
          assignedCityIds={selectedUser.assignedCityIds}
          onToggleCity={(cityId) => {
            const newAssignedCityIds = selectedUser.assignedCityIds.includes(cityId)
              ? selectedUser.assignedCityIds.filter(id => id !== cityId)
              : [...selectedUser.assignedCityIds, cityId];
            onUpdateUser(selectedUser.id, { assignedCityIds: newAssignedCityIds });
          }}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
};

export default UserManagementModal;