import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { City } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';

interface CitiesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  assignedCityIds: string[];
  onToggleCity: (cityId: string) => void;
  userName: string;
}

const CitiesListModal: React.FC<CitiesListModalProps> = ({
  isOpen,
  onClose,
  cities,
  assignedCityIds,
  onToggleCity,
  userName
}) => {
  if (!isOpen) return null;

  const { currentUser } = useAuth();
  const permissions = usePermissions(currentUser);

  const [visibleCityIds, setVisibleCityIds] = useState<string[]>(assignedCityIds);

  // Filter to only show currently visible cities
  const visibleCities = cities.filter(city => visibleCityIds.includes(city.id));

  // Group cities by voivodeship and sort voivodeships
  const voivodeshipGroups = Object.entries(
    visibleCities.reduce((acc, city) => {
      if (!acc[city.voivodeship]) {
        acc[city.voivodeship] = [];
      }
      acc[city.voivodeship].push(city);
      return acc;
    }, {} as Record<string, City[]>)
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const handleUnassignCity = (cityId: string) => {
    if (permissions.isAdmin) {
      setVisibleCityIds(prev => prev.filter(id => id !== cityId));
      onToggleCity(cityId);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-2xl mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Lista miast
              </h2>
              <p className="text-sm text-white/80 mt-1">{userName}</p>
            </div>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {visibleCities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Brak przypisanych miast
            </div>
          ) : (
            <div className="space-y-6">
              {voivodeshipGroups.map(([voivodeship, voivodeshipCities]) => (
                <div key={voivodeship}>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <h3 className="font-medium text-gray-700">
                      {voivodeship} ({getVoivodeshipAbbreviation(voivodeship)})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    {voivodeshipCities.map(city => (
                      <div 
                        key={city.id} 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-gray-700">{city.name}</span>
                        {permissions.isAdmin && (
                          <button
                            onClick={() => handleUnassignCity(city.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          >
                            Wypisz
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitiesListModal;