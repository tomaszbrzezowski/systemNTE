import React, { useState } from 'react';
import { Bell, Calendar, MapPin, X } from 'lucide-react';
import { CalendarEvent, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';

const formatNotificationDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Create new date object with time set to midnight UTC
  const localDate = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  return formatDate(localDate);
};

interface TransferRequestsListProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (event: CalendarEvent) => void;
  onReject: (event: CalendarEvent) => void;
  pendingTransfers: CalendarEvent[];
  users: User[];
}

const TransferRequestsList: React.FC<TransferRequestsListProps> = ({
  isOpen,
  onClose,
  onAccept,
  onReject,
  pendingTransfers,
  users
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-2xl mx-4">
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">
                Oczekujące prośby ({pendingTransfers.filter(e => e.status !== 'przekazany').length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {pendingTransfers.length > 0 ? (
            <div className="space-y-4">
              {pendingTransfers
                .filter(event => event.status !== 'przekazany')
                .map(event => {
                const fromUser = users.find(u => u.id === event.userId);
                
                return (
                  <div
                    key={event.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-red-200 transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                          <span className="font-medium text-gray-900">
                            {formatNotificationDate(event.date)}
                          </span>
                        </div>
                        
                        <p className="text-gray-600">
                          Od: <span className="font-medium text-gray-900">{users.find(u => u.id === event.userId)?.name}</span>
                        </p>

                        {event.city && (
                          <div className="flex items-center space-x-2 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {event.city.name} ({getVoivodeshipAbbreviation(event.city.voivodeship)})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => onReject(event)}
                          className="px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-all font-medium hover:shadow-sm"
                        >
                          Odrzuć
                        </button>
                        <button
                          onClick={() => onAccept(event)}
                          className="px-3 py-1.5 text-sm bg-red-900 text-white rounded-lg hover:bg-red-800 transition-all font-medium shadow-sm hover:shadow-md"
                        >
                          Przyjmij
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Brak oczekujących próśb o przekazanie terminów
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferRequestsList;