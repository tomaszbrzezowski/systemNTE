import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { User, City } from '../../types';

interface AssignCitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  cities: City[];
  onAssign: (cityIds: string[]) => void;
}

const AssignCitiesModal: React.FC<AssignCitiesModalProps> = ({
  isOpen,
  onClose,
  user,
  cities,
  onAssign,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>(user.assignedCityIds || []);

  if (!isOpen) return null;

  const voivodeships = Array.from(new Set(cities.map(city => city.voivodeship))).sort();
  
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.voivodeship.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(selectedCityIds);
  };

  const toggleCity = (cityId: string) => {
    setSelectedCityIds(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const toggleVoivodeship = (voivodeship: string) => {
    const voivodeshipCityIds = cities
      .filter(city => city.voivodeship === voivodeship)
      .map(city => city.id);

    const allSelected = voivodeshipCityIds.every(id => selectedCityIds.includes(id));

    setSelectedCityIds(prev =>
      allSelected
        ? prev.filter(id => !voivodeshipCityIds.includes(id))
        : [...new Set([...prev, ...voivodeshipCityIds])]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Przypisz miasta dla użytkownika
              </h2>
              <p className="text-sm text-gray-500 mt-1">{user.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj miast..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {voivodeships.map(voivodeship => {
              const voivodeshipCities = filteredCities.filter(city => city.voivodeship === voivodeship);
              if (voivodeshipCities.length === 0) return null;

              const allSelected = voivodeshipCities.every(city => selectedCityIds.includes(city.id));
              const someSelected = voivodeshipCities.some(city => selectedCityIds.includes(city.id));

              return (
                <div key={voivodeship}>
                  <div className="flex items-center mb-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => {
                          if (input) {
                            input.indeterminate = someSelected && !allSelected;
                          }
                        }}
                        onChange={() => toggleVoivodeship(voivodeship)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-medium text-gray-700">{voivodeship}</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    {voivodeshipCities.map(city => (
                      <label key={city.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCityIds.includes(city.id)}
                          onChange={() => toggleCity(city.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-gray-600">{city.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            >
              Zapisz przypisania
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignCitiesModal;