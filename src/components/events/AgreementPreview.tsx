import React from 'react';
import { X, FileText, Calendar, MapPin, Users, Phone, Mail } from 'lucide-react';

interface Agreement {
  id: string;
  agreement_number: string;
  season: string;
  agreement_date: string;
  school_name: string;
  school_address: string;
  teacher_name: string;
  teacher_phone: string;
  teacher_email: string;
  hall_city_name: string;
  hall_name: string;
  created_at: string;
}

interface AgreementPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: Agreement;
}

const AgreementPreview: React.FC<AgreementPreviewProps> = ({
  isOpen,
  onClose,
  agreement
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">
                Podgląd umowy
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

        <div className="p-6 space-y-6">
          {/* Agreement header */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Numer umowy</span>
                <p className="text-lg font-medium text-gray-900">{agreement.agreement_number}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data umowy</span>
                <p className="text-lg font-medium text-gray-900">{formatDate(agreement.agreement_date)}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">Sezon</span>
              <p className="text-lg font-medium text-gray-900">{agreement.season}</p>
            </div>
          </div>

          {/* School details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Dane szkoły</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Nazwa szkoły</span>
                  <p className="text-base text-gray-900">{agreement.school_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Adres</span>
                  <p className="text-base text-gray-900">{agreement.school_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Dane nauczyciela</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Imię i nazwisko</span>
                  </div>
                  <p className="text-base text-gray-900">{agreement.teacher_name}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Telefon</span>
                  </div>
                  <p className="text-base text-gray-900">{agreement.teacher_phone}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Email</span>
                  </div>
                  <p className="text-base text-gray-900">{agreement.teacher_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hall details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Dane sali</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Miasto</span>
                  </div>
                  <p className="text-base text-gray-900">{agreement.hall_city_name}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Nazwa sali</span>
                  </div>
                  <p className="text-base text-gray-900">{agreement.hall_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Zamknij
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            >
              Drukuj umowę
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementPreview;