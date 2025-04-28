import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';

interface RowLabelEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  currentLabel: string;
  rowIndex: number;
  sectionName: string;
}

const RowLabelEditModal: React.FC<RowLabelEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentLabel,
  rowIndex,
  sectionName
}) => {
  const [label, setLabel] = useState(currentLabel);

  // Reset label when modal opens with new data
  useEffect(() => {
    setLabel(currentLabel);
  }, [currentLabel, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (label.trim()) {
      onSave(label);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Edytuj etykietę rzędu</h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Sekcja: {sectionName}, Rząd: {rowIndex + 1}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etykieta rzędu
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Wprowadź etykietę rzędu"
              autoFocus
            />
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

export default RowLabelEditModal;