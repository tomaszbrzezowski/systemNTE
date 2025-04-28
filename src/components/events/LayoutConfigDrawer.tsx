import React from 'react';
import { ListOrdered, ChevronLeft, Rows } from 'lucide-react';

interface LayoutConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSection: string | null;
  children?: React.ReactNode;
}

const LayoutConfigDrawer: React.FC<LayoutConfigDrawerProps> = ({ isOpen, onClose, selectedSection, children }) => {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'visible' : 'invisible'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={`absolute top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-red-900 to-red-800 text-white">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-white" />
            <span className="text-white">Konfiguracja sekcji</span>
            {selectedSection && (
              <span className="ml-2 text-sm text-white/80 font-normal">
                • {selectedSection}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Zamknij konfigurator"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-64px)] p-4">
          {children || <p className="text-gray-500 text-sm">Wybierz sekcję, aby zobaczyć jej konfigurację.</p>}
        </div>
      </div>
    </div>
  );
};

export default LayoutConfigDrawer;