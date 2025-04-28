import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SeatsPerRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (seats: number) => void;
  currentSeats?: number;
}

const SeatsPerRowModal: React.FC<SeatsPerRowModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentSeats = 1
}) => {
  const [seats, setSeats] = useState(currentSeats);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(seats);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-sm mx-4">
    <div className="modal-backdrop">
      <div className="modal-content max-w-sm mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              Liczba miejsc w rzędzie
            </h2>
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
              Liczba miejsc
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={seats}
              onChange={(e) => setSeats(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
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
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeatsPerRowModal;
  )
}