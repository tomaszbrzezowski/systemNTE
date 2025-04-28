import React, { useState } from 'react';
import { X } from 'lucide-react';
import { translations } from '../../utils/translations';

interface AddCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

const AddCalendarModal: React.FC<AddCalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd
}) => {
  const [calendarName, setCalendarName] = useState('');
  const t = translations.pl.modal;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calendarName.trim()) {
      onAdd(calendarName);
      setCalendarName('');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md mx-4">
        <div className="modal-header">
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <button
            onClick={onClose}
            className="btn-modal-close absolute top-4 right-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="space-y-4">
            <label htmlFor="calendarName" className="modal-label">
              {t.calendarName}
            </label>
            <input
              type="text"
              id="calendarName"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              className="modal-input"
              placeholder={t.placeholder}
            />
          </div>
        </form>
        
        <div className="modal-footer">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-modal-secondary"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn-modal-primary"
              onClick={handleSubmit}
            >
              {t.add}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCalendarModal;