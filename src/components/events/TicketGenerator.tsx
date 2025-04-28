import React, { useState } from 'react';
import { X, Download, Printer, FileText, Check, AlertTriangle } from 'lucide-react';
import { generateTicketsForSchool, SchoolTicketData, SeatAssignment } from '../../utils/ticketGenerator';

interface TicketGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  schoolName: string;
  date: string;
  showTitle: string;
  showtime: string;
  seats: SeatAssignment[];
}

const TicketGenerator: React.FC<TicketGeneratorProps> = ({
  isOpen,
  onClose,
  eventId,
  schoolName,
  date,
  showTitle,
  showtime,
  seats
}) => {
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateTickets = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(false);

      // Prepare data for ticket generation
      const ticketData: SchoolTicketData = {
        title: showTitle,
        date: date,
        time: showtime,
        seats: seats
      };

      // Generate tickets
      generateTicketsForSchool(ticketData);
      
      // Set success state
      setSuccess(true);
    } catch (err) {
      console.error('Failed to generate tickets:', err);
      setError('Wystąpił błąd podczas generowania biletów');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-lg mx-4">
        <div className="modal-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Generowanie biletów
            </h2>
            <button
              onClick={onClose}
              className="btn-modal-close absolute top-4 right-4"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Informacje o biletach</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Szkoła:</span>
                <span className="font-medium text-gray-900">{schoolName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Spektakl:</span>
                <span className="font-medium text-gray-900">{showTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium text-gray-900">
                  {new Date(date).toLocaleDateString('pl-PL')}, godz. {showtime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Liczba miejsc:</span>
                <span className="font-medium text-gray-900">{seats.length}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">Bilety zostały wygenerowane pomyślnie</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Informacje o biletach</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
              <li>Bilety zostaną wygenerowane w formacie PDF</li>
              <li>Format biletów: 2 bilety w rzędzie, po 5 rzędów na stronę A4</li>
              <li>Bilety zawierają informacje o sekcji, rzędzie i miejscu</li>
              <li>Każdy bilet posiada unikalny numer</li>
              <li>Bilety są posortowane według sekcji, rzędu i miejsca</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleGenerateTickets}
              disabled={generating || seats.length === 0}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generowanie...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generuj bilety</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketGenerator;