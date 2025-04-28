import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface RowSeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowLabel: string;
  initialSeats: number;
  onSave: (seats: number) => void;
}

const RowSeatsModal: React.FC<RowSeatsModalProps> = ({
  isOpen,
  onClose,
  rowLabel,
  initialSeats,
  onSave
}) => {
  const [seats, setSeats] = useState(initialSeats);

  // Reset seats when modal opens with new data
  useEffect(() => {
    setSeats(initialSeats);
  }, [initialSeats, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(seats);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-sm mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">
              Liczba miejsc w rzędzie {rowLabel}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liczba miejsc
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setSeats(Math.max(1, seats - 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-lg border border-gray-300"
              >
                <Minus className="w-4 h-4 text-gray-700" />
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={seats}
                onChange={(e) => setSeats(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-20 text-center py-2 border-y border-gray-300"
                required
              />
              <button
                type="button"
                onClick={() => setSeats(Math.min(50, seats + 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-r-lg border border-gray-300"
              >
                <Plus className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>

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
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RowSeatsModal;