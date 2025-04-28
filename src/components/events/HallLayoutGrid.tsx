import React, { useState } from 'react';
import { Edit2, X, Plus, Minus } from 'lucide-react';
import { toRoman } from '../../utils/romanNumerals';

interface SectionConfig {
  enabled: boolean;
  rows: number;
  seatsPerRow: number;
}

interface HallLayoutGridProps {
  sections: Record<string, SectionConfig>;
  sectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'>;
  numberingDirections?: Record<string, 'ltr' | 'rtl'>;
  selectedSection: 'main' | 'left' | 'right' | 'back' | 'back1' | 'back2' | 'left1' | 'left2' | 'right1' | 'right2' | null;
  onSelectSection: (section: 'main' | 'left' | 'right' | 'back' | 'back1' | 'back2' | 'left1' | 'left2' | 'right1' | 'right2') => void;
  rowLabels?: Record<string, Record<number, string>>;
  sectionNames: Record<string, string>;
  onSectionNameChange: (section: string, name: string) => void;
  onRemoveSeat?: (section: string, rowIndex: number, seatIndex: number) => void;
  rowSeatsPerRow?: Record<string, Record<number, number>>;
  removedSeats?: Record<string, Record<number, Set<number>>>;
  emptyRows?: Record<string, Set<number>>;
  onAddEmptyRow?: (section: string, afterRowIndex: number) => void;
  sectionAlignments?: Record<string, 'left' | 'center' | 'right'>;
  rowAlignments?: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  autoRenumberSeats?: boolean;
  isPreviewMode?: boolean;
  seatAssignments?: Record<string, string>;
  schools?: Array<{ name: string; color: string }>;
  showLegend?: boolean;
  onSeatClick?: (section: string, rowIndex: number, seatIndex: number) => void;
}

const HallLayoutGrid: React.FC<HallLayoutGridProps> = ({
  sections = {},
  sectionNumberingStyles = {},
  numberingDirections = {},
  selectedSection,
  onSelectSection,
  rowLabels = {},
  sectionNames,
  onSectionNameChange,
  onRemoveSeat,
  rowSeatsPerRow = {},
  removedSeats = {},
  emptyRows = {},
  onAddEmptyRow,
  sectionAlignments = {},
  rowAlignments = {},
  autoRenumberSeats = false,
  isPreviewMode = false,
  seatAssignments = {},
  schools = [],
  showLegend = false,
  onSeatClick
}) => {
  const [hoveredRow, setHoveredRow] = useState<{section: string, rowIndex: number} | null>(null);
  const [internalAutoRenumberSeats, setInternalAutoRenumberSeats] = useState<boolean>(autoRenumberSeats);
  
  // Use the prop value if provided, otherwise use internal state
  const effectiveAutoRenumberSeats = autoRenumberSeats !== undefined ? autoRenumberSeats : internalAutoRenumberSeats;
  
  // Function to toggle auto-renumbering of seats
  const toggleAutoRenumberSeats = () => {
    setInternalAutoRenumberSeats(prev => !prev);
  };

  // Get row label based on numbering style
  const getRowLabel = (rowIndex: number, section: 'main' | 'left' | 'right' | 'back' | 'back1' | 'back2'): string => {
    // Check if the section exists in sections prop
    if (!sections[section]) {
      return '';
    }

    // Check if there's a custom label for this row in this section
    if (rowLabels[section] && rowLabels[section][rowIndex]) {
      return rowLabels[section][rowIndex];
    }
    
    // Get the numbering style for this specific section, default to 'arabic'
    const sectionStyle = sectionNumberingStyles[section] || 'arabic';
    
    const rowNumber = rowIndex + 1;
    
    switch (sectionStyle) {
      case 'roman':
        return toRoman(rowNumber);
      case 'letters':
        return String.fromCharCode(64 + rowNumber); // A=65, so A=1, B=2, etc.
      case 'arabic':
      default:
        return rowNumber.toString();
    }
  };

  // Helper function to check if a seat is removed
  const isSeatRemoved = (section: string, rowIndex: number, seatIndex: number): boolean => {
    if (!removedSeats[section]) return false;
    if (!removedSeats[section][rowIndex]) return false;
    const seatSet = removedSeats[section][rowIndex];
    return seatSet instanceof Set && seatSet.has(seatIndex);
  };

  // Calculate seat number within a row with proper numbering direction
  const getSeatNumber = (section: string, rowIndex: number, seatIndex: number, direction?: 'ltr' | 'rtl'): number => {
    // Check if the section exists
    if (!sections[section]) {
      return 0;
    }

    const directionToUse = direction || numberingDirections?.[section] || 'ltr';

    // If auto-renumbering is disabled, just return the seat index + 1
    if (!effectiveAutoRenumberSeats) {
      if (directionToUse === 'rtl') {
        const total = sections[section].seatsPerRow;
        return total - seatIndex;
      }
      return seatIndex + 1;
    }

    // For RTL numbering direction
    if (directionToUse === 'rtl') {
      let visibleSeatsCount = 0;
      for (let i = 0; i < sections[section].seatsPerRow; i++) {
        if (!isSeatRemoved(section, rowIndex, i)) {
          visibleSeatsCount++;
        }
      }

      // If this seat is removed, return 0
      if (isSeatRemoved(section, rowIndex, seatIndex)) {
        return 0;
      }

      

      let visibleSeatsAfter = 0;
      for (let i = 0; i < seatIndex; i++) {
        if (!isSeatRemoved(section, rowIndex, i)) {
          visibleSeatsAfter++;
        }
      }

      return visibleSeatsCount - visibleSeatsAfter;
    }

    // For LTR numbering direction (default)
    let seatNumber = 1;
    for (let i = 0; i < seatIndex; i++) {
      if (!isSeatRemoved(section, rowIndex, i)) {
        seatNumber++;
      }
    }

    // If this seat is removed, return 0
    if (isSeatRemoved(section, rowIndex, seatIndex)) {
      return 0;
    }

    return seatNumber;
  };

  // Helper function to check if a row is empty (aisle)
  const isEmptyRow = (section: string, rowIndex: number): boolean => {
    // Check if emptyRows[section] exists and is a Set
    const sectionEmptyRows = emptyRows[section];
    if (!(sectionEmptyRows instanceof Set)) {
      return false;
    }
    
    // Check if this exact row index is marked as empty
    return sectionEmptyRows.has(rowIndex) || sectionEmptyRows.has(Math.floor(rowIndex)) || false;
  };

  // Render vertical section (for left and right sides)
  const renderVerticalSection = (side: 'left' | 'right') => {
    // Skip if section is not enabled or doesn't exist
    if (!sections[side]?.enabled) return null;
    
    const sideRows = sections[side].rows;
    const sideSeats = sections[side].seatsPerRow;
    const isSelected = selectedSection === side;
    
    return (
      <div 
        className="flex flex-col items-center mb-8"
      >
        <h3 
          className={`text-sm font-medium mb-3 cursor-pointer ${isSelected ? 'text-red-600 font-bold' : 'text-gray-700'}`}
          onClick={() => {
            if (selectedSection === side) {
              onSelectSection(null as any);
            } else {
              onSelectSection(side);
            }
          }}
        >
          {sectionNames[side]}
        </h3>
        <div className="flex">
          {/* Seats grid */}
          <div className="flex">
            {Array.from({ length: sideRows }).map((_, rowIndex) => (
              // Skip rendering row label and seats if this is an empty row
              isEmptyRow(side, rowIndex) ? (
                <div key={rowIndex} className="flex flex-col items-center mx-1">
                  <div className="h-6 flex items-center justify-center">
                    <span className="text-xs text-gray-400">—</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: sideSeats }).map((_, seatIndex) => (
                      <div key={seatIndex} className="w-6 h-6" />
                    ))}
                  </div>
                </div>
              ) : (
              <div key={rowIndex} className="flex flex-col items-center mx-1">
                <div className="h-6 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">{getRowLabel(rowIndex, side)}</span>
                </div>
                <div className={`flex flex-col gap-1 ${
                  rowAlignments[side]?.[rowIndex] === 'left' ? 'items-start' :
                  rowAlignments[side]?.[rowIndex] === 'right' ? 'items-end' :
                  rowAlignments[side]?.[rowIndex] === 'center' ? 'items-center' :
                  sectionAlignments[side] === 'left' ? 'items-start' :
                  sectionAlignments[side] === 'right' ? 'items-end' :
                  'items-center'
                }`}>
                  {Array.from({ length: sideSeats }).map((_, seatIndex) => {
                    // Check if this seat is removed
                    const isRemoved = isSeatRemoved(side, rowIndex, seatIndex);
                    
                    // If seat is removed, render empty space with restore button
                    if (isRemoved) {
                      return (
                        <div key={seatIndex} className="w-6 h-6 relative group">
                          {selectedSection === side && onRemoveSeat && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSeat(side, rowIndex, seatIndex);
                              }}
                              className="absolute inset-0 bg-green-100 border border-green-300 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Przywróć miejsce"
                            >
                              <span className="text-green-700 font-bold">+</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    // Calculate seat number based on whether auto-renumbering is enabled
                    const seatNumber = getSeatNumber(side, rowIndex, seatIndex, numberingDirections[side]);
                    
                    // Get seat assignment if any
                    const seatId = `${side}-${rowIndex}-${seatIndex}`;
                    const assignedSchool = seatAssignments[seatId];
                    const schoolColor = schools.find(s => s.name === assignedSchool)?.color;
                    
                    // Otherwise render the seat
                    return (
                      <div 
                        key={`seat-${seatIndex}`}
                        className={`relative w-6 h-6 rounded flex items-center justify-center group hover:bg-blue-200 transition-colors ${
                          assignedSchool ? 'bg-blue-500 text-white' : 'bg-gray-50 border border-gray-500'
                        } ${isPreviewMode ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (isPreviewMode && onSeatClick) {
                            onSeatClick(side, rowIndex, seatIndex);
                          }
                        }}
                        style={schoolColor ? { backgroundColor: schoolColor } : undefined}
                      >
                        <span className={`text-[12px] ${assignedSchool ? 'text-white' : 'text-gray-700'}`}>
                          {seatNumber}
                        </span>
                        {selectedSection === side && onRemoveSeat && !isPreviewMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveSeat(side, rowIndex, seatIndex); 
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              )
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render back section (BALKON)
  const renderBackSection = (section: 'back' | 'back1' | 'back2') => {
    // Skip if section is not enabled or doesn't exist
    if (!sections[section]?.enabled) return null;
    
    const backRows = sections[section].rows;
    const backSeatsPerRow = sections[section].seatsPerRow;
    const isSelected = selectedSection === section;
    
    return (
      <div 
        className="w-full max-w-4xl mx-auto mb-8"
      >
        <h3 
          className={`text-sm font-medium mb-3 text-center cursor-pointer ${isSelected ? 'text-red-600 font-bold' : 'text-gray-700'}`}
          onClick={() => {
            if (selectedSection === section) {
              onSelectSection(null as any);
            } else {
              onSelectSection(section);
            }
          }}
        >
          {sectionNames[section]}
        </h3>
        <div 
          className="space-y-2 mx-auto overflow-x-auto"
        >
          {Array.from({ length: backRows * 2 }).map((_, index) => {
            // Check if this is a row or an aisle
            const isAisle = index % 2 === 1;
            const rowIndex = Math.floor(index / 2);
            const aisleIndex = rowIndex + 0.5;
            
            // If this is an aisle, check if it should be rendered
            if (isAisle) {
              // Only render if this aisle is marked as empty
              if (!isEmptyRow(section, aisleIndex)) {
                return null;
              }
              
              // Render aisle
              return (
                <div key={`aisle-${rowIndex}`} className="flex items-center justify-center min-w-max">
                  <div className="w-16 text-right pr-4 text-gray-400">
                    —
                  </div>
                  <div className="flex gap-1 justify-center flex-nowrap h-6">
                    {/* Empty space for aisle */}
                    <div className="w-full h-6 border-t-2 border-b-2 border-gray-300 border-dashed flex items-center justify-center min-w-[300px]">
                      <div className="relative group">
                        <span className="text-xs text-gray-400 cursor-pointer">Przejście</span>
                        {selectedSection === section && onAddEmptyRow && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddEmptyRow(section, rowIndex);
                            }}
                            className="ml-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                            title="Usuń przejście"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-16 text-left pl-4 text-gray-400">
                    —
                  </div>
                </div>
              );
            } else {
              // Skip if this row is marked as empty
              if (isEmptyRow(section, rowIndex)) {
                return null;
              }

              // Get the number of seats for this row (custom or default)
              const rowSeats = rowSeatsPerRow[section]?.[rowIndex] !== undefined
                ? rowSeatsPerRow[section][rowIndex]
                : sections[section].seatsPerRow;
              
              // Render normal row
              return (
                <div key={`row-${rowIndex}`} className="flex items-center justify-center min-w-max">
                  <div className="w-16 text-right pr-4 font-bold text-gray-700 relative">
                    <div 
                      className="flex items-center justify-end"
                      onMouseEnter={() => setHoveredRow({section, rowIndex})}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {hoveredRow?.section === section && hoveredRow?.rowIndex === rowIndex && onAddEmptyRow && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddEmptyRow(section, rowIndex);
                          }}
                          className="mr-2 p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                          title={emptyRows[section]?.has(rowIndex + 0.5) ? "Usuń przejście" : "Dodaj przejście po tym rzędzie"}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                      <span>{getRowLabel(rowIndex, section)}</span>
                    </div>
                  </div>
                  <div className={`flex gap-1 flex-nowrap w-full ${
                    rowAlignments[section]?.[rowIndex] === 'left' ? 'justify-start' :
                    rowAlignments[section]?.[rowIndex] === 'right' ? 'justify-end' :
                    rowAlignments[section]?.[rowIndex] === 'center' ? 'justify-center' :
                    sectionAlignments[section] === 'left' ? 'justify-start' :
                    sectionAlignments[section] === 'right' ? 'justify-end' :
                    'justify-center'
                  }`}>
                    {Array.from({ length: rowSeats }).map((_, seatIndex) => {
                      // Check if this seat is removed
                      const isRemoved = isSeatRemoved(section, rowIndex, seatIndex);
                      
                      // If seat is removed, render empty space with restore button
                      if (isRemoved) {
                        return (
                          <div key={seatIndex} className="w-6 h-6 relative group">
                            {selectedSection === section && onRemoveSeat && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveSeat(section, rowIndex, seatIndex);
                                }}
                                className="absolute inset-0 bg-green-100 border border-green-300 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Przywróć miejsce"
                              >
                                <span className="text-green-700 font-bold">+</span>
                              </button>
                            )}
                          </div>
                        );
                      }

                      // Calculate seat number based on whether auto-renumbering is enabled
                      const seatNumber = getSeatNumber(section, rowIndex, seatIndex, numberingDirections[section]);
                      
                      // Get seat assignment if any
                      const seatId = `${section}-${rowIndex}-${seatIndex}`;
                      const assignedSchool = seatAssignments[seatId];
                      const schoolColor = schools.find(s => s.name === assignedSchool)?.color;
                      
                      return (
                        <div 
                          key={`seat-${seatIndex}`}
                          className={`relative w-6 h-6 rounded flex items-center justify-center group hover:bg-blue-200 transition-colors ${
                            assignedSchool ? 'bg-blue-500 text-white' : 'bg-gray-50 border border-gray-500'
                          } ${isPreviewMode ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (isPreviewMode && onSeatClick) {
                              onSeatClick(section, rowIndex, seatIndex);
                            }
                          }}
                          style={schoolColor ? { backgroundColor: schoolColor } : undefined}
                        >
                          <span className={`text-[12px] ${assignedSchool ? 'text-white' : 'text-gray-700'}`}>
                            {seatNumber}
                          </span>
                          {selectedSection === section && onRemoveSeat && !isPreviewMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSeat(section, rowIndex, seatIndex);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="w-16 text-left pl-4 font-bold text-gray-700">
                    {getRowLabel(rowIndex, section)}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  // If sections is undefined or empty, return null
  if (!sections || Object.keys(sections).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full overflow-x-auto max-w-full">
      <div className="bg-gray-100 text-gray-800 w-full max-w-4xl py-2 text-sm font-medium rounded border-b-4 border-gray-300 mx-auto mb-5 px-5">
        <div className="flex items-center justify-center">
          S     C     E     N     A
        </div>
      </div>
      
      <div className="flex w-full justify-center mb-8 max-w-full scale-100 transform-gpu origin-top overflow-x-auto">
        <div className="flex flex-nowrap items-start justify-center min-w-max">
          {/* Left sections */}
          <div className="flex-shrink-0 flex flex-row gap-2 justify-end">
            {sections.left2?.enabled && renderVerticalSection('left2')}
            {sections.left1?.enabled && renderVerticalSection('left1')}
            {sections.left?.enabled && renderVerticalSection('left')}
          </div>
          
          {/* Center section (PARTER) */}
          <div className="flex-shrink-0 min-w-[300px] mx-2">
            <h3 
              className={`text-sm font-medium mb-3 text-center cursor-pointer ${selectedSection === 'main' ? 'text-red-600 font-bold' : 'text-gray-700'}`}
              onClick={() => {
                if (selectedSection === 'main') {
                  onSelectSection(null as any);
                } else {
                  onSelectSection('main');
                }
              }}
            >
              {sectionNames.main}
            </h3>
            <div 
              className="space-y-2 mx-auto overflow-x-auto"
            >
              {sections.main && Array.from({ length: sections.main.rows * 2 }).map((_, index) => {
                // Check if this is a row or an aisle
                const isAisle = index % 2 === 1;
                const rowIndex = Math.floor(index / 2);
                const aisleIndex = rowIndex + 0.5;
                
                // If this is an aisle, check if it should be rendered
                if (isAisle) {
                  // Only render if this aisle is marked as empty
                  if (!isEmptyRow('main', aisleIndex)) {
                    return null;
                  }
                  
                  // Render aisle
                  return (
                    <div key={`aisle-${rowIndex}`} className="flex items-center justify-center min-w-max">
                      <div className="w-16 text-right pr-4 text-gray-400">
                        —
                      </div>
                      <div className="flex gap-1 justify-center flex-nowrap h-6">
                        {/* Empty space for aisle */}
                        <div className="w-full h-6 border-t border-b border-gray-300 border-dashed flex items-center justify-center min-w-[300px]">
                          <div className="relative group">
                            <span className="text-xs text-gray-400 cursor-pointer">Przejście</span>
                            {selectedSection === 'main' && onAddEmptyRow && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddEmptyRow('main', rowIndex);
                                }}
                                className="ml-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 inline-flex items-center justify-center"
                                title="Usuń przejście"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-16 text-left pl-4 text-gray-400">
                        —
                      </div>
                    </div>
                  );
                } else {
                  // Skip if this row is marked as empty
                  if (isEmptyRow('main', rowIndex)) {
                    return null;
                  }

                  // Get the number of seats for this row (custom or default)
                  const rowSeats = rowSeatsPerRow['main']?.[rowIndex] !== undefined
                    ? rowSeatsPerRow['main'][rowIndex]
                    : sections.main.seatsPerRow;
                  
                  // Render normal row
                  return (
                    <div key={`row-${rowIndex}`} className="flex items-center justify-center min-w-max">
                      <div className="w-16 text-right pr-4 font-bold text-gray-700 relative">
                        <div 
                          className="flex items-center justify-end"
                          onMouseEnter={() => setHoveredRow({section: 'main', rowIndex})}
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          {hoveredRow?.section === 'main' && hoveredRow?.rowIndex === rowIndex && onAddEmptyRow && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddEmptyRow('main', rowIndex);
                              }}
                              className="mr-2 p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                              title={emptyRows['main']?.has(rowIndex + 0.5) ? "Usuń przejście" : "Dodaj przejście po tym rzędzie"}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                          <span>{getRowLabel(rowIndex, 'main')}</span>
                        </div>
                      </div>
                      <div className={`flex gap-1 flex-nowrap w-full ${
                        rowAlignments['main']?.[rowIndex] === 'left' ? 'justify-start' :
                        rowAlignments['main']?.[rowIndex] === 'right' ? 'justify-end' :
                        rowAlignments['main']?.[rowIndex] === 'center' ? 'justify-center' :
                        sectionAlignments['main'] === 'left' ? 'justify-start' :
                        sectionAlignments['main'] === 'right' ? 'justify-end' :
                        'justify-center'
                      }`}>
                        {Array.from({ length: rowSeats }).map((_, seatIndex) => {
                          // Check if this seat is removed
                          const isRemoved = isSeatRemoved('main', rowIndex, seatIndex);
                          
                          // If seat is removed, render empty space with restore button
                          if (isRemoved) {
                            return (
                              <div key={seatIndex} className="w-6 h-6 relative group">
                                {selectedSection === 'main' && onRemoveSeat && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveSeat('main', rowIndex, seatIndex);
                                    }}
                                    className="absolute inset-0 bg-green-100 border border-green-300 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Przywróć miejsce"
                                  >
                                    <span className="text-green-700 font-bold">+</span>
                                  </button>
                                )}
                              </div>
                            );
                          }

                          // Calculate seat number based on whether auto-renumbering is enabled
                          const seatNumber = getSeatNumber('main', rowIndex, seatIndex, numberingDirections['main']);
                          
                          // Get seat assignment if any
                          const seatId = `main-${rowIndex}-${seatIndex}`;
                          const assignedSchool = seatAssignments[seatId];
                          const schoolColor = schools.find(s => s.name === assignedSchool)?.color;
                          
                          return (
                            <div 
                              key={`seat-${seatIndex}`}
                              className={`relative w-6 h-6 rounded flex items-center justify-center group hover:bg-blue-200 transition-colors ${
                                assignedSchool ? 'bg-blue-500 text-white' : 'bg-gray-50 border border-gray-500'
                              } ${isPreviewMode ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (isPreviewMode && onSeatClick) {
                                  onSeatClick('main', rowIndex, seatIndex);
                                }
                              }}
                              style={schoolColor ? { backgroundColor: schoolColor } : undefined}
                            >
                              <span className={`text-[12px] ${assignedSchool ? 'text-white' : 'text-gray-700'}`}>
                                {seatNumber}
                              </span>
                              {selectedSection === 'main' && onRemoveSeat && !isPreviewMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveSeat('main', rowIndex, seatIndex);
                                  }}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="w-16 text-left pl-4 font-bold text-gray-700">
                        {getRowLabel(rowIndex, 'main')}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
          
          {/* Right sections */}
          <div className="flex-shrink-0 flex flex-row gap-2 justify-start">
            {sections.right?.enabled && renderVerticalSection('right')}
            {sections.right1?.enabled && renderVerticalSection('right1')}
            {sections.right2?.enabled && renderVerticalSection('right2')}
          </div>
        </div>
      </div>
      
      {/* Add spacing between PARTER and BALKON */}
      {(sections.back?.enabled || sections.back1?.enabled || sections.back2?.enabled) && 
        <div className="h-8 border-t border-gray-200 w-full max-w-4xl mx-auto mt-4"></div>}
      
      {/* Back sections (BALKONY) */}
      {sections.back?.enabled && renderBackSection('back')}
      {sections.back1?.enabled && renderBackSection('back1')}
      {sections.back2?.enabled && renderBackSection('back2')}
      
      {/* Show legend if enabled */}
      {showLegend && schools.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-4 w-full max-w-4xl">
          <div className="flex flex-wrap gap-4 justify-center">
            {schools.map(school => (
              <div key={school.name} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: school.color }}
                />
                <span className="text-sm text-gray-700">{school.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden element to expose the setAutoRenumberSeats function to parent component */}
      <div id="renumberSeatsControl" style={{ display: 'none' }}>
        <button 
          onClick={toggleAutoRenumberSeats}
          data-testid="renumber-seats-button"
        >
          {effectiveAutoRenumberSeats ? "Pomiń miejsca" : "Numeruj całość"}
        </button>
      </div>
    </div>
  );
};

export default HallLayoutGrid;