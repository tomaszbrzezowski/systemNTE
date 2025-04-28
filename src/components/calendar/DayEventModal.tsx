import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User, City, EventStatus } from '../../types';
import { getDaysDifference } from '../../utils/dateUtils';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate } from '../../utils/dateUtils';
import { EVENT_STATUSES } from '../../utils/statusConstants';
import { getVoivodeshipAbbreviation } from '../../utils/voivodeshipUtils';

interface DayEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    userId: string;
    city: City | null;
    status: EventStatus;
    previousUserId?: string;
  }) => void;
  dates: string[];
  users: User[];
  cities: City[];
  currentUser: User | null;
  currentEvent?: {
    userId: string;
    status: EventStatus;
    city?: City | null;
    previousUserId?: string;
  };
}

const DayEventModal: React.FC<DayEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dates,
  users,
  cities,
  currentUser,
  currentEvent,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<EventStatus>(currentEvent?.status || 'niewydany');
  const [selectedCity, setSelectedCity] = useState<City | null>(currentEvent?.city || null);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentEvent?.userId || '');
  const [error, setError] = useState<string>('');
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [selectedTransferUserId, setSelectedTransferUserId] = useState<string>('');

  const formatModalDate = (dateStr: string): string => {
    // Create date at noon UTC to avoid timezone issues
    const date = new Date(dateStr + 'T12:00:00.000Z');
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const permissions = usePermissions(currentUser);
  const isAdmin = currentUser?.role === 'administrator';
  const isOwner = currentEvent?.userId === currentUser?.id;
  const isCompleted = currentEvent?.status === 'zrobiony';

  // Always show edit mode for administrators
  const isEditable = isAdmin || (!isCompleted && isOwner);

  // Always show "Edycja terminu" for administrators
  const modalTitle = isAdmin ? 'Edycja terminu' : (isEditable ? 'Edycja terminu' : 'Podgląd terminu');

  // Filter out przekazywany and przekazany statuses
  const availableStatuses = Object.keys(EVENT_STATUSES)
    .filter(status => 
      status !== 'przekazywany' && 
      status !== 'przekazany'
      && (isAdmin || status !== 'wydany')
    )
    .filter(status => {
      // For non-admins, show only allowed statuses
      if (!isAdmin) {
        return [
          'w_trakcie',
          'zrobiony',
          'do_przejęcia',
          'przekaz'
        ].includes(status);
      }
      return true;
    }) as EventStatus[];

  const showTransferUserSelection = selectedStatus === 'przekaz';
  const showUserSelection = isAdmin && !showTransferUserSelection;

  // Show city selection for appropriate statuses and for admin when status is w_trakcie or zrobiony
  const showCitySelection = (
    selectedStatus !== 'niewydany' &&
    selectedStatus !== 'wolne' &&
    selectedStatus !== 'do_przejęcia' &&
    selectedStatus !== 'wydany' &&
    selectedStatus !== 'przekaz' &&
    (
      !isAdmin || 
      (isAdmin && (selectedStatus === 'w_trakcie' || selectedStatus === 'zrobiony'))
    )
  );

  useEffect(() => {
    // Only show the alert banner, not the confirmation dialog
    if (selectedStatus === 'zrobiony' && dates.length > 0) {
      const eventDate = new Date(dates[0]);
      const today = new Date();
      const daysDifference = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      setShowStatusAlert(daysDifference <= 30 && daysDifference >= 0);
    } else {
      setShowStatusAlert(false);
    }
  }, [selectedStatus, currentEvent?.status]);

  useEffect(() => {
    if (currentEvent) {
      setSelectedStatus(currentEvent.status);
      setSelectedCity(currentEvent.city || null);
      setSelectedUserId(currentEvent.userId || '');
    }
  }, [currentEvent]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate city selection for 'zrobiony' and 'w_trakcie' statuses
    if ((selectedStatus === 'zrobiony' || selectedStatus === 'w_trakcie') && !selectedCity) {
      setError('Wybór miasta jest wymagany dla statusu "W trakcie" lub "Zrobiony"');
      return;
    }

    // Validate user selection for wydany status when admin
    if (isAdmin && selectedStatus === 'wydany' && !selectedUserId) {
      setError('Proszę wybrać użytkownika dla statusu "Wydany"');
      return;
    }

    // Validate przekaz status requires target user
    if (selectedStatus === 'przekaz' && !selectedTransferUserId) {
      setError('Proszę wybrać użytkownika do przekazania terminu');
      return;
    }

    // Prevent transferring to self
    if (selectedStatus === 'przekaz' && selectedTransferUserId === currentUser?.id) {
      setError('Nie można przekazać terminu do siebie');
      return;
    }

    // Show confirmation dialog when status is 'zrobiony'
    if (selectedStatus === 'zrobiony' && currentEvent?.status !== 'zrobiony') {
      const eventDate = new Date(dates[0]);
      const today = new Date();
      const daysDifference = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference <= 30 && daysDifference >= 0) {
        const confirmed = window.confirm(
          'Jeżeli nastąpiła zmiana miasta realizacji poinformuj o tym fakcie niezwłocznie Biuro Widowni oraz Realizatora'
        );
        if (!confirmed) return;
      }
    }

    const eventData = {
      userId: isAdmin && selectedStatus === 'wydany' ? selectedUserId : currentUser?.id,
      city: selectedCity,
      status: selectedStatus === 'przekaz' ? 'przekazywany' : selectedStatus,
      previousUserId: currentEvent?.previousUserId,
      toUserId: selectedStatus === 'przekaz' ? selectedTransferUserId : undefined
    };

    onSave(eventData);
    onClose();
  };

  const getLocationDisplay = (city: City | null, isOwnEvent: boolean) => {
    if (!city) return 'Brak przypisania';
    if (isAdmin || isOwnEvent) {
      return `${city.name} (${getVoivodeshipAbbreviation(city.voivodeship)})`;
    }
    return city.voivodeship;
  };

  const assignedUser = currentEvent?.userId ? users.find(u => u.id === currentEvent.userId) : null;
  const assignedCity = currentEvent?.city;
  const isOwnEvent = currentEvent?.userId === currentUser?.id;

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-md mx-4">
        <>
          <div className="modal-header">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">{modalTitle}</h2>
              <button
                onClick={onClose}
                className="btn-modal-close absolute top-4 right-4"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="modal-body">
            {currentEvent && (
              <div className="mt-4 space-y-3">
                {showStatusAlert && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Jeżeli nastąpiła zmiana miasta realizacji poinformuj o tym fakcie niezwłocznie Biuro Widowni oraz Realizatora
                    </p>
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                        <div className="text-sm text-gray-600">Status:</div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${EVENT_STATUSES[currentEvent.status].color}`} />
                          <span className="text-sm font-medium text-gray-700">
                            {EVENT_STATUSES[currentEvent.status].label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                        <div className="text-sm text-gray-600">Użytkownik:</div>
                        <div className="text-sm font-medium text-gray-900">
                          {assignedUser?.name || 'Brak przypisania'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                        <div className="text-sm text-gray-600">Miejsce:</div>
                        <div className="text-sm font-medium text-gray-900">
                          {getLocationDisplay(assignedCity, isOwnEvent)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {(isEditable || isAdmin) && (
              <>
                <div>
                  <label className="modal-label">
                    Status terminu:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableStatuses.map(status => {
                      const statusInfo = EVENT_STATUSES[status];
                      if (!statusInfo) return null;
                      
                      return (
                        <label
                          key={status}
                          className={`flex items-start space-x-2 p-2 rounded border 
                            cursor-pointer
                            ${selectedStatus === status ? 'ring-2 ring-red-500' : ''}
                            hover:bg-gray-50`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status}
                            checked={selectedStatus === status}
                            onChange={(e) => setSelectedStatus(e.target.value as EventStatus)}
                            className="hidden"
                          />
                          <span className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${statusInfo.color}`} />
                          <span className="text-xs text-left">{statusInfo.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {showUserSelection && (
                  <div>
                    <label className="modal-label">
                      Przypisz użytkownika:
                      {selectedStatus === 'wydany' && <span className="text-red-500 ml-1">*wymagane</span>}
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="modal-select"
                      required={selectedStatus === 'wydany'}
                    >
                      <option value="">Wybierz użytkownika</option>
                      {users
                        .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {showTransferUserSelection && (
                  <div>
                    <label className="modal-label">
                      Przekaż termin do:
                      <span className="text-red-500 ml-1">*wymagane</span>
                    </label>
                    <select
                      value={selectedTransferUserId}
                      onChange={(e) => setSelectedTransferUserId(e.target.value)}
                      className="modal-select"
                      required={selectedStatus === 'przekaz'}
                    >
                      <option value="">Wybierz użytkownika</option>
                      {users
                        .filter(user => user.id !== currentUser?.id)
                        .map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                {showCitySelection && (
                  <div>
                    <label className="modal-label">
                      Miasto:
                      {((selectedStatus === 'zrobiony' || selectedStatus === 'w_trakcie') && !isAdmin) && (
                        <span className="text-red-500 ml-1">*wymagane</span>
                      )}
                    </label>
                    <select
                      value={selectedCity?.id || ''}
                      onChange={(e) => {
                        const city = cities.find(c => c.id === e.target.value);
                        setSelectedCity(city || null);
                      }}
                      className="modal-select"
                      required
                    >
                      <option value="">Wybierz miasto</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.name} ({city.voivodeship})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {error && (
                  <div className="modal-error">{error}</div>
                )}
              </>
            )}
            </form>
          </div>
          
          <div className="modal-footer">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-modal-secondary"
              >
                {isEditable ? 'Anuluj' : 'Zamknij'}
              </button>
              {(isEditable || isAdmin) && (
                <button
                  onClick={handleSubmit}
                  className="btn-modal-primary"
                >
                  Zapisz zmiany
                </button>
              )}
            </div>
          </div>
        </>
      </div>
    </div>
  );
};

export default DayEventModal;