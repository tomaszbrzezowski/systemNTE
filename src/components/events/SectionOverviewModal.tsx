import React from 'react';
import { Dialog } from '@headlessui/react';
import { Edit2, ChevronRight, ChevronLeft, Settings, X } from 'lucide-react';

interface SectionOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Record<string, { enabled: boolean; rows: number; seatsPerRow: number }>;
  sectionNames: Record<string, string>;
  sectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'>;
  numberingDirections: Record<string, 'ltr' | 'rtl'>;
  toggleSection: (section: any) => void;
  updateSectionConfig: (section: string, field: 'rows' | 'seatsPerRow', value: number) => void;
  updateSectionNumberingStyle: (section: string, style: 'arabic' | 'roman' | 'letters') => void;
  toggleNumberingDirection: (section: string) => void;
  openSectionNameModal: (section: string) => void;
}

const SectionOverviewModal: React.FC<SectionOverviewModalProps> = ({
  isOpen,
  onClose,
  sections,
  sectionNames,
  sectionNumberingStyles,
  numberingDirections,
  toggleSection,
  updateSectionConfig,
  updateSectionNumberingStyle,
  toggleNumberingDirection,
  openSectionNameModal,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <Dialog.Panel className="mx-auto max-w-5xl w-full rounded-xl bg-white shadow-xl overflow-hidden">
          <Dialog.Title className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-900 to-red-800 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-white" />
              <span className="text-xl font-semibold">Konfiguracja sekcji sali</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </Dialog.Title>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] flex flex-col gap-6">
            {/* Top row: Left, Main, Right */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Balconies */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-1 text-center">Balkony Lewe</h3>
                {['left', 'left1', 'left2'].map(sectionKey => (
                  <div key={sectionKey} className={`border rounded-lg p-3 ${sections[sectionKey].enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <h3 className={`text-sm font-medium ${sections[sectionKey].enabled ? 'text-blue-800' : 'text-gray-500'}`}>
                        {sectionNames[sectionKey]}
                      </h3>
                      <button
                        onClick={() => openSectionNameModal(sectionKey)}
                        className={`p-1 ${sections[sectionKey].enabled ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sections[sectionKey].enabled}
                        onChange={() => toggleSection(sectionKey)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {sections[sectionKey].enabled && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">
                            Rzędy
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={sections[sectionKey].rows}
                            onChange={(e) => updateSectionConfig(
                              sectionKey,
                              'rows',
                              Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                            )}
                            className="w-full px-2 py-1 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-blue-700 mb-1">
                            Miejsca
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={sections[sectionKey].seatsPerRow}
                            onChange={(e) => updateSectionConfig(
                              sectionKey,
                              'seatsPerRow',
                              Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                            )}
                            className="w-full px-2 py-1 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-blue-700 mb-1">
                            Numeracja
                          </label>
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'arabic')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'arabic'
                                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              1,2,3
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'roman')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'roman'
                                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              I,II,III
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'letters')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'letters'
                                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              A,B,C
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <label className="block text-xs font-medium text-blue-700 mb-1">
                            Kierunek
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleNumberingDirection(sectionKey)}
                            className="w-full py-1 px-1 bg-white hover:bg-blue-50 rounded-lg border border-blue-300 text-xs text-blue-700 flex items-center justify-center gap-1"
                          >
                            {numberingDirections[sectionKey] === 'ltr' ? (
                              <>
                                <ChevronRight className="w-3 h-3" />
                                <span>L→P</span>
                              </>
                            ) : (
                              <>
                                <ChevronLeft className="w-3 h-3" />
                                <span>P→L</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                ))}
              </div>
              
              {/* Main section (PARTER) */}
              <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-medium text-red-800">
                      {sectionNames['main']}
                    </h3>
                    <button
                      onClick={() => openSectionNameModal('main')}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Liczba rzędów
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sections['main'].rows}
                      onChange={(e) => updateSectionConfig(
                        'main',
                        'rows',
                        Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                      )}
                      className="w-full px-3 py-1.5 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Miejsc w rzędzie
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={sections['main'].seatsPerRow}
                      onChange={(e) => updateSectionConfig(
                        'main',
                        'seatsPerRow',
                        Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                      )}
                      className="w-full px-3 py-1.5 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    />
                  </div>
  
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Styl numeracji rzędów
                    </label>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => updateSectionNumberingStyle('main', 'arabic')}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-xs ${
                          sectionNumberingStyles['main'] === 'arabic'
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        1, 2, 3
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSectionNumberingStyle('main', 'roman')}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-xs ${
                          sectionNumberingStyles['main'] === 'roman'
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        I, II, III
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSectionNumberingStyle('main', 'letters')}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-xs ${
                          sectionNumberingStyles['main'] === 'letters'
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        A, B, C
                      </button>
                    </div>
                  </div>
  
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Kierunek numeracji
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleNumberingDirection('main')}
                      className="w-full py-1.5 px-2 bg-white hover:bg-red-50 rounded-lg border border-red-300 text-xs text-red-700 flex items-center justify-center gap-1"
                    >
                      {numberingDirections['main'] === 'ltr' ? (
                        <>
                          <ChevronRight className="w-3 h-3" />
                          <span>Od lewej do prawej</span>
                        </>
                      ) : (
                        <>
                          <ChevronLeft className="w-3 h-3" />
                          <span>Od prawej do lewej</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Balconies */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-1 text-center">Balkony Prawe</h3>
                {['right', 'right1', 'right2'].map(sectionKey => (
                  <div key={sectionKey} className={`border rounded-lg p-3 ${sections[sectionKey].enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <h3 className={`text-sm font-medium ${sections[sectionKey].enabled ? 'text-green-800' : 'text-gray-500'}`}>
                        {sectionNames[sectionKey]}
                      </h3>
                      <button
                        onClick={() => openSectionNameModal(sectionKey)}
                        className={`p-1 ${sections[sectionKey].enabled ? 'text-green-500 hover:text-green-700 hover:bg-green-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sections[sectionKey].enabled}
                        onChange={() => toggleSection(sectionKey)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {sections[sectionKey].enabled && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Rzędy
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={sections[sectionKey].rows}
                            onChange={(e) => updateSectionConfig(
                              sectionKey,
                              'rows',
                              Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                            )}
                            className="w-full px-2 py-1 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Miejsca
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={sections[sectionKey].seatsPerRow}
                            onChange={(e) => updateSectionConfig(
                              sectionKey,
                              'seatsPerRow',
                              Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                            )}
                            className="w-full px-2 py-1 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Numeracja
                          </label>
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'arabic')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'arabic'
                                  ? 'bg-green-100 border-green-300 text-green-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              1,2,3
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'roman')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'roman'
                                  ? 'bg-green-100 border-green-300 text-green-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              I,II,III
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'letters')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'letters'
                                  ? 'bg-green-100 border-green-300 text-green-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              A,B,C
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            Kierunek
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleNumberingDirection(sectionKey)}
                            className="w-full py-1 px-1 bg-white hover:bg-green-50 rounded-lg border border-green-300 text-xs text-green-700 flex items-center justify-center gap-1"
                          >
                            {numberingDirections[sectionKey] === 'ltr' ? (
                              <>
                                <ChevronRight className="w-3 h-3" />
                                <span>L→P</span>
                              </>
                            ) : (
                              <>
                                <ChevronLeft className="w-3 h-3" />
                                <span>P→L</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                ))}
              </div>
            </div>

            {/* Back Balconies */}
            <div className="space-y-3 col-span-full flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-1 text-center">Balkony Tylne</h3>
              <div className="grid grid-cols-1 gap-3">
                {['back', 'back1', 'back2'].map(sectionKey => (
                  <div
  key={sectionKey}
  className={`w-full max-w-md border rounded-lg p-4 ${sections[sectionKey].enabled ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}
>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <h3 className={`text-sm font-medium ${sections[sectionKey].enabled ? 'text-purple-800' : 'text-gray-500'}`}>
                          {sectionNames[sectionKey]}
                        </h3>
                        <button
                          onClick={() => openSectionNameModal(sectionKey)}
                          className={`p-1 ${sections[sectionKey].enabled ? 'text-purple-500 hover:text-purple-700 hover:bg-purple-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-full transition-colors`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sections[sectionKey].enabled}
                          onChange={() => toggleSection(sectionKey)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {sections[sectionKey].enabled && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <div className="col-span-1">
                          <label className="block text-xs font-medium text-purple-700 mb-1">
                            Rzędy
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={sections[sectionKey].rows}
                            onChange={(e) => updateSectionConfig(
                              sectionKey,
                              'rows',
                              Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                            )}
                            className="w-full px-2 py-1 border border-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <label className="block text-xs font-medium text-purple-700 mb-1">
                            Miejsca
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={sections[sectionKey].seatsPerRow}
                            onChange={(e) => updateSectionConfig(
                              sectionKey,
                              'seatsPerRow',
                              Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                            )}
                            className="w-full px-2 py-1 border border-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                          />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-medium text-purple-700 mb-1">
                            Numeracja
                          </label>
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'arabic')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'arabic'
                                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              1,2,3
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'roman')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'roman'
                                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              I,II
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSectionNumberingStyle(sectionKey, 'letters')}
                              className={`flex-1 py-1 px-1 rounded-lg border text-xs ${
                                sectionNumberingStyles[sectionKey] === 'letters'
                                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              A,B
                            </button>
                          </div>
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-medium text-purple-700 mb-1">
                            Kierunek
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleNumberingDirection(sectionKey)}
                            className="w-full py-1 px-1 bg-white hover:bg-purple-50 rounded-lg border border-purple-300 text-xs text-purple-700 flex items-center justify-center gap-1"
                          >
                            {numberingDirections[sectionKey] === 'ltr' ? (
                              <>
                                <ChevronRight className="w-3 h-3" />
                                <span>L→P</span>
                              </>
                            ) : (
                              <>
                                <ChevronLeft className="w-3 h-3" />
                                <span>P→L</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SectionOverviewModal;