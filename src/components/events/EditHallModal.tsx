import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EditHallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; address: string }) => void;
  initialData: {
    name: string;
    address: string;
  };
}

const EditHallModal: React.FC<EditHallModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [name, setName] = useState(initialData.name);
  const [address, setAddress] = useState(initialData.address);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !address.trim()) {
      setError('Nazwa i adres są wymagane');
      return;
    }

    onSave({
      name: name.trim(),
      address: address.trim(),
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Edytuj salę</h2>
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
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHallModal;