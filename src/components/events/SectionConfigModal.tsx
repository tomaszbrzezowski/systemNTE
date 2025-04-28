import React from 'react';
import { Dialog } from '@headlessui/react';
import { X, Settings } from 'lucide-react';

interface SectionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const SectionConfigModal: React.FC<SectionConfigModalProps> = ({ isOpen, onClose, children, title = 'Konfiguracja sekcji' }) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      <Dialog.Panel className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 z-50 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-900 to-red-800 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-white" />
              <Dialog.Title className="text-xl font-semibold text-white">
                {title}
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] flex-1">
          {children}
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

export default SectionConfigModal;
