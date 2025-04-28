import React, { useState } from 'react';
import { Bell, Send, AlertCircle, RefreshCw } from 'lucide-react';
import { SmsMessage } from '../../services/notifications/types';
import { sendBulkSms } from '../../services/notifications/smsService';
import { supabase } from '../../lib/supabase';
import SmsStatusBadge from './SmsStatusBadge';

interface BulkSmsFormProps {
  recipients: {
    id: string;
    name: string;
    phone: string;
    phoneType: 'k' | 's';
    eventDate: string;
    title: string;
    eventCity: string;
    tickets: string;
  }[];
  onClose: () => void;
}

const BulkSmsForm: React.FC<BulkSmsFormProps> = ({ recipients, onClose }) => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [smsStatuses, setSmsStatuses] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const refreshStatuses = async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from('sms_messages')
        .select('id, status')
        .in('id', recipients.map(r => r.id));
      
      if (data) {
        const newStatuses = data.reduce((acc, curr) => ({
          ...acc,
          [curr.id]: curr.status
        }), {});
        setSmsStatuses(newStatuses);
      }
    } catch (error) {
      console.error('Failed to refresh statuses:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const messages: SmsMessage[] = recipients
        .filter(r => selectedRecipients.includes(r.id))
        .map(r => ({
          smsId: r.id,
          phoneType: r.phoneType,
          phone: r.phone,
          name: r.name,
          eventDate: r.eventDate,
          title: r.title,
          eventCity: r.eventCity,
          tickets: r.tickets
        }));

      await sendBulkSms(messages);
      await refreshStatuses();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const toggleAll = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(r => r.id));
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-2xl mx-4">
        <div className="modal-header">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Wyślij powiadomienia SMS
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                Wiadomości zostały wysłane pomyślnie!
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Wybierz odbiorców
                {Object.keys(smsStatuses).length > 0 && (
                  <button
                    type="button"
                    onClick={refreshStatuses}
                    disabled={refreshing}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </h3>
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm text-red-600 hover:text-red-800"
              >
                {selectedRecipients.length === recipients.length ? 
                  'Odznacz wszystkich' : 'Zaznacz wszystkich'}
              </button>
            </div>

            <div className="border rounded-lg divide-y">
              {recipients.map(recipient => (
                <label
                  key={recipient.id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(recipient.id)}
                    onChange={(e) => {
                      setSelectedRecipients(prev =>
                        e.target.checked
                          ? [...prev, recipient.id]
                          : prev.filter(id => id !== recipient.id)
                      );
                    }}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{recipient.name}</p>
                    <p className="text-sm text-gray-500">
                      {recipient.phone} ({recipient.phoneType === 'k' ? 'komórkowy' : 'stacjonarny'})
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {recipient.eventCity}, {new Date(recipient.eventDate).toLocaleDateString('pl-PL')}
                    </p>
                    {smsStatuses[recipient.id] !== undefined && (
                      <div className="mt-2">
                        <SmsStatusBadge status={smsStatuses[recipient.id]} />
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
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
              disabled={sending || selectedRecipients.length === 0}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>
                {sending ? 'Wysyłanie...' : 'Wyślij wiadomości'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkSmsForm;