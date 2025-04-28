import React from 'react';
import { Plus, Settings, Minus, X } from 'lucide-react';

interface Section {
  name: string;
  rows: number;
  rowSeats: number[];
  removedSeats: { [key: number]: Set<number> };
  seatGaps: { [key: number]: Set<number> };
  customRowLabels: { [key: number]: string };
  emptyRows: Set<number>;
  orientation: 'horizontal' | 'vertical';
  numberingStyle: 'arabic' | 'roman' | 'letters';
  alignment: 'left' | 'center' | 'right';
}

interface InteractiveLayoutEditorProps {
  sections: Record<string, Section>;
  onSectionUpdate: (sectionId: string, updates: Partial<Section>) => void;
  onSectionVisibilityChange: (sectionId: string, isVisible: boolean) => void;
  selectedSectionId: string | null;
  onSectionSelect: (sectionId: string | null) => void;
  scale: number;
  showSectionList: boolean;
  numberingType: 'arabic' | 'roman' | 'letters';
  isPreviewMode: boolean;
}

const InteractiveLayoutEditor: React.FC<InteractiveLayoutEditorProps> = ({
  sections,
  onSectionUpdate,
  onSectionVisibilityChange,
  selectedSectionId,
  onSectionSelect,
  scale,
  showSectionList,
  numberingType,
  isPreviewMode
}) => {
  // Helper function to get row label based on numbering type
  const getRowLabel = (index: number, style: 'arabic' | 'roman' | 'letters', customLabel?: string): string => {
    if (customLabel) return customLabel;
    
    switch (style) {
      case 'arabic':
        return (index + 1).toString();
      case 'roman':
        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        return romanNumerals[index] || (index + 1).toString();
      case 'letters':
        return String.fromCharCode(65 + index);
      default:
        return (index + 1).toString();
    }
  };

  // Calculate seat number within a row
  const getRowSeatNumber = (rowIndex: number, seatIndex: number, section: Section): number => {
    let seatNumber = 1;
    for (let i = 0; i < seatIndex; i++) {
      if (!section.removedSeats[rowIndex]?.has(i) && !section.seatGaps[rowIndex]?.has(i)) {
        seatNumber++;
      }
    }
    return seatNumber;
  };

  // Render a single section
  const renderSection = (sectionId: string, section: Section) => {
    const isSelected = sectionId === selectedSectionId;
    const sectionClass = section.orientation === 'horizontal' 
      ? 'flex-col items-center' 
      : 'flex-row items-start';

    const alignmentClass = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end'
    }[section.alignment];

    return (
      <div 
        className={`p-6 ${isPreviewMode ? 'bg-transparent' : 'bg-gray-50'} rounded-lg border ${
          isSelected && !isPreviewMode ? 'border-blue-300 shadow-lg' : 'border-gray-200'
        } ${
          section.name === 'Parter' ? 'order-0' :
          section.name.includes('lewy') ? 'order-[-1]' :
          section.name.includes('prawy') ? 'order-1' : 'order-2'
        } transition-all`}
        onClick={() => !isPreviewMode && onSectionSelect(sectionId)}
      >
        <div className={`flex items-center ${isPreviewMode ? 'justify-center' : 'justify-between'} mb-4`}>
          <span className={`text-sm font-medium text-gray-700 ${isPreviewMode ? 'text-center' : ''}`}>
            {section.name}
          </span>
          {isSelected && !isPreviewMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSectionVisibilityChange(sectionId, !section.visible);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        <div 
          className={`space-y-2 transform origin-top flex ${sectionClass}`}
          style={{ transform: `scale(${scale})` }}
        >
          {Array.from({ length: section.rows }).map((_, rowIndex) => (
            <div key={rowIndex} className={`flex items-center ${alignmentClass} gap-4`}>
              {/* Row controls */}
              {!isPreviewMode && (
                <div className="w-20 flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      const newRowSeats = [...section.rowSeats];
                      newRowSeats[rowIndex] = Math.max(0, newRowSeats[rowIndex] - 1);
                      onSectionUpdate(sectionId, { rowSeats: newRowSeats });
                    }}
                    className="w-5 h-5 flex items-center justify-center text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      const newRowSeats = [...section.rowSeats];
                      newRowSeats[rowIndex]++;
                      onSectionUpdate(sectionId, { rowSeats: newRowSeats });
                    }}
                    className="w-5 h-5 flex items-center justify-center text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-right text-sm text-gray-500">
                    {getRowLabel(rowIndex, numberingType, section.customRowLabels[rowIndex])}
                  </span>
                </div>
              )}

              {/* Seats */}
              <div className="flex gap-1">
                {Array.from({ length: section.rowSeats[rowIndex] }).map((_, seatIndex) => {
                  const isRemoved = section.removedSeats[rowIndex]?.has(seatIndex);
                  const isGap = section.seatGaps[rowIndex]?.has(seatIndex);

                  if (isGap) {
                    return (
                      <div key={seatIndex} className="w-6 h-6 bg-gray-100 border border-dashed border-gray-300 rounded">
                        {!isPreviewMode && (
                          <button
                            onClick={() => {
                              const newGaps = { ...section.seatGaps };
                              newGaps[rowIndex].delete(seatIndex);
                              onSectionUpdate(sectionId, { seatGaps: newGaps });
                            }}
                            className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 bg-red-100 rounded transition-opacity"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={seatIndex}
                      className={`w-6 h-6 rounded ${
                        isRemoved 
                          ? 'opacity-25 bg-gray-200' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors relative group`}
                      onClick={() => {
                        if (isPreviewMode) return;
                        const newRemoved = { ...section.removedSeats };
                        if (!newRemoved[rowIndex]) newRemoved[rowIndex] = new Set();
                        if (isRemoved) {
                          newRemoved[rowIndex].delete(seatIndex);
                        } else {
                          newRemoved[rowIndex].add(seatIndex);
                        }
                        onSectionUpdate(sectionId, { removedSeats: newRemoved });
                      }}
                      disabled={isPreviewMode}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600">
                        {getRowSeatNumber(rowIndex, seatIndex, section)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Row label */}
              <div className="w-20 text-left text-sm text-gray-500">
                {getRowLabel(rowIndex, numberingType, section.customRowLabels[rowIndex])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Stage label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white w-[480px] py-2 text-sm font-medium rounded text-center border-b-4 border-gray-800">
        S   C   E   N   A
      </div>

      {/* Layout container */}
      <div className="mt-20 flex flex-wrap justify-center gap-12">
        {Object.entries(sections).map(([sectionId, section]) => (
          <React.Fragment key={sectionId}>
            {renderSection(sectionId, section)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default InteractiveLayoutEditor;