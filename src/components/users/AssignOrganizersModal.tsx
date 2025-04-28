import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { User } from '../../types';

interface AssignOrganizersModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: User;
  availableOrganizers: User[];
  onAssign: (organizerIds: string[]) => void;
}

const AssignOrganizersModal: React.FC<AssignOrganizersModalProps> = ({
  isOpen,
  onClose,
  supervisor,
  availableOrganizers,
  onAssign,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganizerIds, setSelectedOrganizerIds] = useState<string[]>([]);

  const assignedOrganizers = availableOrganizers.filter(org => 
    selectedOrganizerIds.includes(org.id)
  );

  const assignedOrganizersSection = assignedOrganizers.length > 0 && (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
      <h3 className="text-sm font-medium text-blue-800 mb-2">
        Przypisani organizatorzy:
      </h3>
      <div className="flex flex-wrap gap-2">
        {assignedOrganizers.map(org => (
          <div
            key={org.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 rounded-lg"
          >
            <span className="text-sm text-blue-700">{org.name}</span>
            <span className="text-xs text-blue-500">{org.email}</span>
          </div>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    // Initialize with currently assigned organizers
    const currentOrganizers = supervisor.organizatorIds || [];
    setSelectedOrganizerIds(currentOrganizers);
  }, [supervisor]);

  if (!isOpen) return null;

  const filteredOrganizers = availableOrganizers.filter(
    organizer => 
      organizer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(selectedOrganizerIds);
  };

  const toggleOrganizer = (organizerId: string) => {
    setSelectedOrganizerIds(prev =>
      prev.includes(organizerId)
        ? prev.filter(id => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Przypisz organizatorów do supervisora
              </h2>
              <p className="text-sm text-white/80 mt-1">{supervisor.name}</p>
            </div>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {assignedOrganizersSection}

          {assignedOrganizers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Przypisani organizatorzy:
              </div>
              <div className="flex flex-wrap gap-2">
                {assignedOrganizers.map(org => (
                  <div
                    key={org.id}
                    className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700 flex items-center"
                  >
                    {org.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj organizatorów..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            {filteredOrganizers.map(organizer => (
              <label
                key={organizer.id}
                className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOrganizerIds.includes(organizer.id)}
                  onChange={() => toggleOrganizer(organizer.id)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{organizer.name}</div>
                  <div className="text-sm text-gray-500">{organizer.email}</div>
                </div>
              </label>
            ))}
            {filteredOrganizers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Brak dostępnych organizatorów
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            >
              Zapisz przypisania
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignOrganizersModal;