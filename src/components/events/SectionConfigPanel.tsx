import React, { useState } from 'react';
import { Edit, Check } from 'lucide-react';
import SectionConfigModal from './SectionConfigModal';
import SectionSettingsPanel from './SectionSettingsPanel';

interface Section {
  id: string;
  name: string;
  enabled: boolean;
  rows: number;
  seatsPerRow: number;
  numerationType: '1, 2, 3' | 'I, II, III' | 'A, B, C';
  numberingDirection: 'Od lewej do prawej' | 'Od prawej do lewej';
}

interface SectionGroup {
  title: string;
  sections: Section[];
}

interface SectionConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sections: Record<string, any>) => void;
  initialSections: Record<string, any>;
}

const SectionConfigPanel: React.FC<SectionConfigPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSections
}) => {
  const [sections, setSections] = useState<Record<string, any>>(initialSections || {});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const toggleSection = (sectionId: string) => {
    setSections({
      ...sections,
      [sectionId]: {
        ...sections[sectionId],
        enabled: !sections[sectionId].enabled
      }
    });
  };

  const updateSectionRows = (sectionId: string, rows: number) => {
    setSections({
      ...sections,
      [sectionId]: {
        ...sections[sectionId],
        rows
      }
    });
  };

  const updateSectionSeats = (sectionId: string, seatsPerRow: number) => {
    setSections({
      ...sections,
      [sectionId]: {
        ...sections[sectionId],
        seatsPerRow
      }
    });
  };

  const updateNumerationType = (sectionId: string, type: '1, 2, 3' | 'I, II, III' | 'A, B, C') => {
    const numerationStyleMap = {
      '1, 2, 3': 'arabic',
      'I, II, III': 'roman',
      'A, B, C': 'letters'
    };
    
    setSections({
      ...sections,
      [sectionId]: {
        ...sections[sectionId],
        numerationType: type,
        numberingStyle: numerationStyleMap[type]
      }
    });
  };

  const updateNumberingDirection = (sectionId: string, direction: 'Od lewej do prawej' | 'Od prawej do lewej') => {
    const directionMap = {
      'Od lewej do prawej': 'ltr',
      'Od prawej do lewej': 'rtl'
    };
    
    setSections({
      ...sections,
      [sectionId]: {
        ...sections[sectionId],
        numberingDirection: direction,
        numberingDirectionValue: directionMap[direction]
      }
    });
  };

  const handleSave = () => {
    onSave(sections);
    onClose();
  };

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    setShowSettingsModal(true);
  };

  // Get section color based on section ID
  const getSectionColor = (sectionId: string) => {
    if (sectionId === 'main') return 'bg-red-100 hover:bg-red-200 border-red-300 text-red-800';
    if (sectionId.startsWith('left')) return 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800';
    if (sectionId.startsWith('right')) return 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800';
    if (sectionId.startsWith('back')) return 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800';
    return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800';
  };

  const mapSectionData = () => {
    const sectionGroups: SectionGroup[] = [
      {
        title: 'Parter',
        sections: [
          mapSectionToUI('main', 'PARTER')
        ]
      },
      {
        title: 'Balkony Lewe',
        sections: [
          mapSectionToUI('left', 'BALKON LEWY I'),
          mapSectionToUI('left1', 'BALKON LEWY II'),
          mapSectionToUI('left2', 'BALKON LEWY III')
        ]
      },
      {
        title: 'Balkony Prawe',
        sections: [
          mapSectionToUI('right', 'BALKON PRAWY I'),
          mapSectionToUI('right1', 'BALKON PRAWY II'),
          mapSectionToUI('right2', 'BALKON PRAWY III')
        ]
      },
      {
        title: 'Balkony Tylne',
        sections: [
          mapSectionToUI('back', 'BALKON I'),
          mapSectionToUI('back1', 'BALKON II'),
          mapSectionToUI('back2', 'BALKON III')
        ]
      }
    ];

    return sectionGroups;
  };

  const mapSectionToUI = (sectionId: string, defaultName: string): Section => {
    const section = sections[sectionId] || {};
    
    // Map numbering style to UI representation
    let numerationType: '1, 2, 3' | 'I, II, III' | 'A, B, C' = '1, 2, 3';
    if (section.numberingStyle === 'roman') numerationType = 'I, II, III';
    else if (section.numberingStyle === 'letters') numerationType = 'A, B, C';
    
    // Map numbering direction to UI representation
    let numberingDirection: 'Od lewej do prawej' | 'Od prawej do lewej' = 'Od lewej do prawej';
    if (section.numberingDirection === 'rtl') numberingDirection = 'Od prawej do lewej';
    
    return {
      id: sectionId,
      name: section.name || defaultName,
      enabled: section.enabled !== false, // Default to true if not specified
      rows: section.rows || 5,
      seatsPerRow: section.seatsPerRow || 10,
      numerationType,
      numberingDirection
    };
  };

  const sectionGroups = mapSectionData();

  return (
    <SectionConfigModal 
      isOpen={isOpen} 
      onClose={() => {
        // Ask for confirmation if changes were made
        if (JSON.stringify(sections) !== JSON.stringify(initialSections)) {
          if (confirm('Czy na pewno chcesz zamknąć bez zapisywania zmian?')) {
            onClose();
          }
        } else {
          onClose();
        }
      }}
      title="Konfiguracja planu sali"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {sectionGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="font-medium text-gray-700 border-b pb-2">{group.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {group.sections.map((section) => {
                  const isEnabled = section.enabled;
                  const sectionColor = getSectionColor(section.id);
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`relative p-4 rounded-lg border ${sectionColor} transition-all ${
                        !isEnabled ? 'opacity-50' : ''
                      } text-left`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{section.name}</span>
                        <div className="flex items-center space-x-2">
                          <label className="relative inline-flex items-center cursor-pointer" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isEnabled} 
                              onChange={() => toggleSection(section.id)}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                          <Edit className="w-4 h-4" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-xs opacity-75">Rzędy:</span>
                          <div className="font-medium">{section.rows}</div>
                        </div>
                        <div>
                          <span className="text-xs opacity-75">Miejsca:</span>
                          <div className="font-medium">{section.seatsPerRow}</div>
                        </div>
                        <div>
                          <span className="text-xs opacity-75">Numeracja:</span>
                          <div className="font-medium">{section.numerationType}</div>
                        </div>
                        <div>
                          <span className="text-xs opacity-75">Kierunek:</span>
                          <div className="font-medium text-xs">{section.numberingDirection}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            Zapisz konfigurację
          </button>
        </div>
      </div>

      {selectedSection && (
        <SectionConfigModal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedSection(null);
          }}
          title={`Ustawienia sekcji: ${sections[selectedSection]?.name || ''}`}
        >
          <SectionSettingsPanel
            section={sections[selectedSection] || {}}
            onUpdate={(updatedSection) => {
              setSections({
                ...sections,
                [selectedSection]: {
                  ...sections[selectedSection],
                  ...updatedSection
                }
              });
            }}
            onClose={() => {
              setShowSettingsModal(false);
              setSelectedSection(null);
            }}
          />
        </SectionConfigModal>
      )}
    </SectionConfigModal>
  );
};

export default SectionConfigPanel;