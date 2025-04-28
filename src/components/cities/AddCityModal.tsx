import React, { useState } from 'react';
import { X } from 'lucide-react';
import { City } from '../../types';

interface AddCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (city: Omit<City, 'id'>) => void;
  existingVoivodeships: string[];
}

const AddCityModal: React.FC<AddCityModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingVoivodeships,
}) => {
  const [name, setName] = useState('');
  const [voivodeship, setVoivodeship] = useState('');
  const [population, setPopulation] = useState<string>('');
  const [newVoivodeship, setNewVoivodeship] = useState('');
  const [isAddingNewVoivodeship, setIsAddingNewVoivodeship] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && (voivodeship || newVoivodeship)) {
      onAdd({
        name,
        voivodeship: isAddingNewVoivodeship ? newVoivodeship : voivodeship,
        population: population ? parseInt(population, 10) : undefined,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Dodaj nowe miasto</h2>
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
              Nazwa miasta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Województwo
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewVoivodeship(!isAddingNewVoivodeship)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                {isAddingNewVoivodeship ? 'Wybierz istniejące' : 'Dodaj nowe'}
              </button>
            </div>
            
            {isAddingNewVoivodeship ? (
              <input
                type="text"
                value={newVoivodeship}
                onChange={(e) => setNewVoivodeship(e.target.value)}
                placeholder="Wprowadź nazwę województwa"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            ) : (
              <select
                value={voivodeship}
                onChange={(e) => setVoivodeship(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Wybierz województwo</option>
                {existingVoivodeships.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liczba mieszkańców
            </label>
            <input
              type="number"
              value={population}
              onChange={(e) => setPopulation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Wprowadź liczbę mieszkańców"
              min="0"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
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
            >
              Dodaj miasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCityModal;