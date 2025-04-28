import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { City } from '../../types';

interface EditCoordinatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: City;
  onSave: (cityId: string, latitude: number, longitude: number) => void;
}

const EditCoordinatesModal: React.FC<EditCoordinatesModalProps> = ({
  isOpen,
  onClose,
  city,
  onSave,
}) => {
  const [latitude, setLatitude] = useState(city.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(city.longitude?.toString() || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Współrzędne muszą być liczbami');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Szerokość geograficzna musi być między -90 a 90 stopni');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Długość geograficzna musi być między -180 a 180 stopni');
      return;
    }

    onSave(city.id, lat, lng);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md mx-4">
        <div className="modal-header">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Edytuj współrzędne - {city.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-modal-close absolute top-4 right-4"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Szerokość geograficzna
            </label>
            <input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="modal-input"
              placeholder="np. 52.2297"
              required
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
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="modal-input"
              placeholder="np. 21.0122"
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
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCoordinatesModal;