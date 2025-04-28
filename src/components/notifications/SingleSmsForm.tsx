import React, { useState } from 'react';
import { Send, AlertCircle, X } from 'lucide-react';
import { sendBulkSms } from '../../services/notifications/smsService';
import { SmsMessage } from '../../services/notifications/types';
import SmsStatusBadge from './SmsStatusBadge';

interface SingleSmsFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const SingleSmsForm: React.FC<SingleSmsFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    title: '',
    eventDate: '',
    eventCity: '',
    tickets: ''
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      // Validate phone number
      const phoneRegex = /^[0-9]{9}$/;
      if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
        throw new Error('Wprowadź poprawny numer telefonu (9 cyfr)');
      }

      // Validate date
      if (!formData.eventDate) {
        throw new Error('Wprowadź datę wydarzenia');
      }

      const message: SmsMessage = {
        smsId: crypto.randomUUID(),
        phoneType: 'k',
        phone: formData.phone,
        name: formData.name,
        eventDate: new Date(formData.eventDate).toISOString(),
        title: formData.title,
        eventCity: formData.eventCity,
        tickets: formData.tickets
      };

      const response = await sendBulkSms([message]);
      setStatus(response[0].status);
      
      if (response[0].status === 3) {
        // Clear form on success
        setFormData({
          phone: '',
          name: '',
          title: '',
          eventDate: '',
          eventCity: '',
          tickets: ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłania');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-lg mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Wyślij pojedynczy SMS</h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {status !== null && (
            <div className="mb-4">
              <SmsStatusBadge status={status} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numer telefonu *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="123456789"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imię i nazwisko
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Jan Kowalski"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tytuł spektaklu *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Nazwa spektaklu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data wydarzenia *
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miasto *
            </label>
            <input
              type="text"
              value={formData.eventCity}
              onChange={(e) => setFormData({ ...formData, eventCity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Warszawa"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liczba biletów
            </label>
            <input
              type="number"
              value={formData.tickets}
              onChange={(e) => setFormData({ ...formData, tickets: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={sending}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Wysyłanie...' : 'Wyślij SMS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SingleSmsForm;