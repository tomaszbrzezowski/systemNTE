import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Plus, Search, MapPin, Trash2, Users, Building2 } from 'lucide-react';
import { City, User } from '../../types';
import AddCityModal from './AddCityModal';
import EditCoordinatesModal from './EditCoordinatesModal';
import AssignedUsersModal from './AssignedUsersModal';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';

interface CityManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  users: User[];
  onAddCity: (city: Omit<City, 'id'>) => void;
  onDeleteCity: (cityId: string) => void;
  onUpdateCity: (cityId: string, city: City) => void;
}

const CityManagementModal: React.FC<CityManagementModalProps> = ({
  isOpen,
  onClose,
  cities,
  users,
  onAddCity,
  onDeleteCity,
  onUpdateCity,
}) => {
  // All hooks must be called before any conditional returns
  const { currentUser } = useAuth();
  const permissions = usePermissions(currentUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showEditCoordinatesModal, setShowEditCoordinatesModal] = useState(false);
  const [newCity, setNewCity] = useState<{ 
    name: string; 
    voivodeship: string; 
    population?: number;
    latitude?: number;
    longitude?: number;
  }>({
    name: '',
    voivodeship: ''
  });
  const [showNewCityForm, setShowNewCityForm] = useState(false);
  const [selectedVoivodeship, setSelectedVoivodeship] = useState<string>('');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoize assigned users map for faster lookups
  const assignedUsersMap = useMemo(() => {
    const map = new Map<string, User[]>();
    cities.forEach(city => {
      map.set(city.id, users.filter(user => user.assignedCityIds.includes(city.id)));
    });
    return map;
  }, [cities, users]);

  // Memoize voivodeships list
  const voivodeships = useMemo(() => 
    Array.from(new Set(cities.map(city => city.voivodeship))).sort(),
    [cities]
  );

  const filteredCities = useMemo(() => cities.filter(city => {
    // Base search filter
    const matchesSearch = !debouncedSearchTerm || 
                         city.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         city.voivodeship.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    // Voivodeship filter
    const matchesVoivodeship = !selectedVoivodeship || city.voivodeship === selectedVoivodeship;

    // For administrators
    if (permissions.isAdmin) {
      const assignedUsers = assignedUsersMap.get(city.id) || [];
      return matchesSearch && matchesVoivodeship && (!showOnlyAssigned || assignedUsers.length > 0);
    }
    
    // For non-admin users
    const isAssignedToUser = currentUser?.assignedCityIds.includes(city.id);
    
    // For supervisors, also show cities assigned to their organizers
    const isAssignedToOrganizers = currentUser?.role === 'supervisor' && 
      (assignedUsersMap.get(city.id) || []).some(user => currentUser.organizatorIds.includes(user.id));

    return matchesSearch && 
           matchesVoivodeship && 
           (isAssignedToUser || isAssignedToOrganizers);
  }), [
    cities,
    debouncedSearchTerm,
    selectedVoivodeship,
    showOnlyAssigned,
    permissions.isAdmin,
    currentUser,
    assignedUsersMap
  ]);

  const citiesByVoivodeship = useMemo(() => {
    const grouped = new Map<string, City[]>();
    
    // Create a Set to track unique city IDs
    const processedCityIds = new Set<string>();
    
    // Process each city only once
    for (const city of filteredCities) {
      // Skip if we've already processed this city
      if (processedCityIds.has(city.id)) continue;
      
      // Mark this city as processed
      processedCityIds.add(city.id);
      
      // Add city to its voivodeship group
      if (!grouped.has(city.voivodeship)) {
        grouped.set(city.voivodeship, []);
      }
      grouped.get(city.voivodeship)!.push(city);
    }
    
    // Sort cities within each voivodeship
    grouped.forEach((cities, voivodeship) => {
      grouped.set(voivodeship, cities.sort((a, b) => a.name.localeCompare(b.name)));
    });
    
    return new Map([...grouped.entries()].sort());
  }, [filteredCities]);

  const handleAddCity = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.name || !newCity.voivodeship) return;

    try {
      await onAddCity(newCity);
      setNewCity({ name: '', voivodeship: '' });
      setShowNewCityForm(false);
    } catch (error) {
    } finally {
      console.error('Failed to add city:', error);
    }
  }, [newCity, onAddCity]);

  const getAssignedUsers = useCallback((cityId: string): User[] => {
    return assignedUsersMap.get(cityId) || [];
  }, [assignedUsersMap]);

  const formatPopulation = useCallback((population?: number) => {
    if (!population) return '';
    return new Intl.NumberFormat('pl-PL').format(population);
  }, []);

  if (!isOpen || !currentUser) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">Zarządzanie miastami</h2>
              <p className="text-sm text-white/80 mt-1">
                {searchTerm || selectedVoivodeship || showOnlyAssigned
                  ? `Wyświetlane miasta: ${filteredCities.length} z ${cities.length}`
                  : `Wszystkie miasta: ${cities.length}`
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="relative w-[700px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj miast..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input text-gray-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={selectedVoivodeship}
              onChange={(e) => setSelectedVoivodeship(e.target.value)}
              className="modal-select text-gray-900 w-[700px] focus:ring-2 focus:ring-red-500"
            >
              <option value="">Wszystkie województwa</option>
              {voivodeships.map(voivodeship => (
                <option key={voivodeship} value={voivodeship}>
                  {voivodeship} ({getVoivodeshipAbbreviation(voivodeship)})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyAssigned}
                  onChange={(e) => setShowOnlyAssigned(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
              </label>
              <span className="text-xs text-white font-medium whitespace-nowrap">Tylko przypisane miasta</span>
            </div>

            {permissions.isAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowNewCityForm(!showNewCityForm)}
                  className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Dodaj miasto</span>
                </button>
              </div>
            )}
          </div>
          
          {showNewCityForm && permissions.isAdmin && (
            <form onSubmit={handleAddCity} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa miasta
                  </label>
                  <input
                    type="text"
                    value={newCity.name}
                    onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Województwo
                  </label>
                  <select
                    value={newCity.voivodeship}
                    onChange={(e) => setNewCity({ ...newCity, voivodeship: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">Wybierz województwo</option>
                    {voivodeships.map(voivodeship => (
                      <option key={voivodeship} value={voivodeship}>
                        {voivodeship}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liczba mieszkańców
                  </label>
                  <input
                    type="number"
                    value={newCity.population || ''}
                    onChange={(e) => setNewCity({ ...newCity, population: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="Opcjonalnie"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Szerokość geograficzna
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-90"
                    max="90"
                    value={newCity.latitude || ''}
                    onChange={(e) => setNewCity({ ...newCity, latitude: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="np. 52.2297"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Długość geograficzna
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="-180"
                    max="180"
                    value={newCity.longitude || ''}
                    onChange={(e) => setNewCity({ ...newCity, longitude: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                    placeholder="np. 21.0122"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewCityForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  Dodaj miasto
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="divide-y divide-gray-100">
            {voivodeships
              .filter(voivodeship => 
                !selectedVoivodeship || voivodeship === selectedVoivodeship
              )
              .map(voivodeship => {
                const voivodeshipCities = citiesByVoivodeship.get(voivodeship) || [];
                const filteredVoivodeshipCities = voivodeshipCities.filter(city =>
                  city.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (filteredVoivodeshipCities.length === 0) return null;

                return (
                  <div key={voivodeship} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="text-sm font-medium text-gray-500 mb-2 text-left">
                      {voivodeship} ({getVoivodeshipAbbreviation(voivodeship)})
                    </h3>
                    <div className="space-y-1">
                      {filteredVoivodeshipCities.map(city => {
                        const assignedUsers = getAssignedUsers(city.id);
                        
                        return (
                          <div
                            key={city.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3 text-left">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div>
                                <span className="text-gray-900">{city.name}</span>
                                {city.population && (
                                  <span className="text-sm text-gray-500 ml-2 mr-4">
                                    ({formatPopulation(city.population)} mieszkańców)
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  <MapPin className="w-3 h-3 inline-block mr-1" />
                                  {city.latitude ? (
                                    <>
                                      {Math.abs(city.latitude).toFixed(4)}°{city.latitude >= 0 ? 'N' : 'S'}, {' '}
                                      {Math.abs(city.longitude).toFixed(4)}°{city.longitude >= 0 ? 'E' : 'W'}
                                    </>
                                  ) : (
                                    'Brak współrzędnych'
                                  )}
                                </span>
                              </div>
                              {assignedUsers.length > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedCity(city);
                                    setShowUsersModal(true);
                                  }}
                                  className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  <Users className="w-3 h-3" />
                                  <span>{assignedUsers.length}</span>
                                </button>
                              )}
                            </div>
                            {permissions.isAdmin && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedCity(city);
                                    setShowEditCoordinatesModal(true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                  title="Edytuj współrzędne"
                                >
                                  <MapPin className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteCity(city.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Usuń miasto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {permissions.isAdmin && (
        <AddCityModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={onAddCity}
          existingVoivodeships={voivodeships}
        />
      )}

      {selectedCity && (
        <AssignedUsersModal
          isOpen={showUsersModal}
          onClose={() => {
            setShowUsersModal(false);
            setSelectedCity(null);
          }}
          city={selectedCity}
          assignedUsers={getAssignedUsers(selectedCity.id)}
        />
      )}
      
      {selectedCity && (
        <EditCoordinatesModal
          isOpen={showEditCoordinatesModal}
          onClose={() => {
            setShowEditCoordinatesModal(false);
            setSelectedCity(null);
          }}
          city={selectedCity}
          onSave={(cityId, latitude, longitude) => {
            onUpdateCity(cityId, { ...selectedCity, latitude, longitude });
          }}
        />
      )}
    </div>
  );
};

export default CityManagementModal