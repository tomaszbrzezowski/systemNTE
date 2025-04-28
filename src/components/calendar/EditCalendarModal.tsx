import React, { useState } from 'react';
import { X } from 'lucide-react';
import { translations } from '../../utils/translations';

interface EditCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (name: string) => void;
  currentName: string;
}

const EditCalendarModal: React.FC<EditCalendarModalProps> = ({ 
  isOpen, 
  onClose, 
  onEdit,
  currentName 
}) => {
  const [calendarName, setCalendarName] = useState(currentName);
  const t = translations.pl.modal;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calendarName.trim()) {
      onEdit(calendarName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t.editTitle}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="calendarName" className="block text-sm font-medium text-gray-700 mb-1">
              {t.calendarName}
            </label>
            <input
              type="text"
              id="calendarName"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t.placeholder}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCalendarModal;