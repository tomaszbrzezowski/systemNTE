import React, { useState } from 'react';
import { X } from 'lucide-react';
import { City } from '../../types';

interface AddHallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (hall: { name: string; city_id: string; address: string }) => void;
  cities: City[];
}

const AddHallModal: React.FC<AddHallModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  cities
}) => {
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !cityId || !address.trim()) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    try {
      await onAdd({
        name: name.trim(),
        city_id: cityId,
        address: address.trim()
      });
      
      // Reset form
      setName('');
      setCityId('');
      setAddress('');
      onClose();
    } catch (error) {
      setError('Wystąpił błąd podczas dodawania sali');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Dodaj nową salę</h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa sali
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modal-input"
              placeholder="Wprowadź nazwę sali"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miasto
            </label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="modal-input"
              required
            >
              <option value="">Wybierz miasto</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.voivodeship}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="modal-input"
              placeholder="Wprowadź adres sali"
              required
            />
          </div>

          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-secondary"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="btn-modal-primary"
            >
              Dodaj salę
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHallModal;