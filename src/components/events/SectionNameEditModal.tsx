import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SectionNameEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: string, name: string) => void;
  section: string;
  initialName: string;
}

const SectionNameEditModal: React.FC<SectionNameEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  section,
  initialName
}) => {
  const [name, setName] = useState(initialName);

  // Reset name when modal opens with new section
  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(section, name);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Edytuj nazwę sekcji</h2>
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
              Nazwa sekcji
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Wprowadź nazwę sekcji"
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

export default SectionNameEditModal;