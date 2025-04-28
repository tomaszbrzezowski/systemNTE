import React from 'react';
import { Edit2, X, ArrowDown } from 'lucide-react';
import { useState } from 'react';

interface SectionBlock {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rows: number;
  rowSeats: number[];
  removedSeats: { [key: number]: Set<number> };
  seatGaps: { [key: number]: Set<number> };
  emptyRows: Set<number>;
  orientation: 'horizontal' | 'vertical';
  numberingStyle: 'arabic' | 'roman' | 'letters';
  numberingDirection: 'ltr' | 'rtl';
  alignment: 'left' | 'center' | 'right';
  position: 'center' | 'left' | 'right' | 'back';
  rowAlignments?: { [key: number]: 'left' | 'center' | 'right' };
}

interface SectionConfig {
  enabled: boolean;
  rows: number;
  seatsPerRow: number;
}

interface StaticSectionProps {
  section: SectionBlock;
  isSelected: boolean;
  onClick: () => void;
  onSeatClick?: (rowIndex: number, seatIndex: number) => void;
  onSeatRemove?: (rowIndex: number, seatIndex: number) => void;
  isPreviewMode?: boolean;
  cellSize: number;
  onSectionUpdate?: (updates: Partial<SectionBlock>) => void;
  seatAssignments?: Record<string, string>;
  schools?: { name: string; color: string }[];
  sectionColor?: string;
  numberingDirection?: 'ltr' | 'rtl';
}

const StaticSection: React.FC<StaticSectionProps> = ({
  section,
  isSelected,
  onClick,
  onSeatClick,
  onSeatRemove,
  isPreviewMode = false,
  cellSize,
  onSectionUpdate,
  seatAssignments = {},
  schools = [],
  sectionColor = 'border-gray-200',
  numberingDirection
}) => {
  // Helper function to get row label based on numbering style
  const getRowLabel = (index: number, style: 'arabic' | 'roman' | 'letters'): string => {
    switch (style) {
      case 'arabic':
        return (index + 1).toString();
      case 'letters':
        return String.fromCharCode(65 + index);
      case 'roman':
        return toRoman(index + 1);
      default:
        return (index + 1).toString();
    }
  };

  // Convert number to Roman numeral
  const toRoman = (num: number): string => {
    const romanNumerals = [
      { value: 1000, numeral: 'M' },
      { value: 900, numeral: 'CM' },
      { value: 500, numeral: 'D' },
      { value: 400, numeral: 'CD' },
      { value: 100, numeral: 'C' },
      { value: 90, numeral: 'XC' },
      { value: 50, numeral: 'L' },
      { value: 40, numeral: 'XL' },
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];
    
    let result = '';
    let remaining = num;
    
    for (const { value, numeral } of romanNumerals) {
      while (remaining >= value) {
        result += numeral;
        remaining -= value;
      }
    }
    
    return result;
  };

  // Helper function to check if a seat should be rendered as a gap
  const shouldRenderGap = (rowIndex: number, seatIndex: number): boolean => {
    const seatGaps = section.seatGaps && section.seatGaps[rowIndex];
    return seatGaps ? seatGaps.has(seatIndex) : false;
  };

  // Helper function to check if a seat is removed
  const isSeatRemoved = (rowIndex: number, seatIndex: number): boolean => {
    const removedSeats = section.removedSeats && section.removedSeats[rowIndex];
    return removedSeats ? removedSeats.has(seatIndex) : false;
  };

  // Calculate seat number within a row with proper numbering direction
  const getSeatNumber = (rowIndex: number, seatIndex: number): number => {
    let seatNumber = 1;

    for (let i = 0; i < seatIndex; i++) {
      if (!isSeatRemoved(rowIndex, i) && !shouldRenderGap(rowIndex, i)) {
        seatNumber++;
      }
    }

    // For RTL numbering direction, invert the seat number
    if (numberingDirection === 'rtl' || section.numberingDirection === 'rtl') {
      const totalVisibleSeats = (section.rowSeats[rowIndex] || 0) - 
        ((section.removedSeats[rowIndex]?.size || 0)) - 
        ((section.seatGaps[rowIndex]?.size || 0));

      return totalVisibleSeats - seatNumber + 1;
    }

    return seatNumber;
  };

  // Get school color for a seat
  const getSeatColor = (rowIndex: number, seatIndex: number): string | undefined => {
    if (!isPreviewMode) return undefined;

    const seatId = `${section.id}-${rowIndex}-${seatIndex}`;
    const schoolName = seatAssignments[seatId];

    if (!schoolName) return undefined;

    const school = schools.find(s => s.name === schoolName);
    return school?.color;
  };

  // Main render function that chooses between horizontal and vertical orientation
  const renderSeats = () => {
    if (section.orientation === 'horizontal') {
      return renderHorizontalSeats();
    } else {
      return renderVerticalSeats();
    }
  };

  // Render horizontal seats with proper alignment
  const renderHorizontalSeats = () => {
    return Array.from({ length: section.rows }).map((_, rowIndex) => {
      // Skip empty rows
      if (section.emptyRows instanceof Set && section.emptyRows.has(rowIndex)) {
        return null;
      }
      
      const rowLabel = getRowLabel(rowIndex, section.numberingStyle);
      const seatsInRow = section.rowSeats[rowIndex] || 0;
      
      // Get row-specific alignment or fall back to section alignment
      const currentRowAlignment = section.rowAlignments?.[rowIndex] || section.alignment;
     
      return (
        <div 
          key={rowIndex}
          className="flex flex-row items-center mb-2"
        >
          {/* Row label (left side) */}
          <div className="w-8 text-center text-xs font-medium text-gray-700 mr-2">
            <div className="flex items-center justify-center h-full">{rowLabel}</div>
          </div>
          
          {/* Seats */}
          <div className={`flex gap-1 flex-1 ${
           currentRowAlignment === 'left' ? 'justify-start' : 
           currentRowAlignment === 'right' ? 'justify-end' : 
            'justify-center'
          }`}>
            {Array.from({ length: seatsInRow }).map((_, seatIndex) => {
              // Skip removed seats
              if (isSeatRemoved(rowIndex, seatIndex)) {
                return <div key={`removed-${seatIndex}`} className="w-6 h-6" />;
              }
              
              // Render gap
              if (shouldRenderGap(rowIndex, seatIndex)) {
                return (
                  <div
                    key={`gap-${seatIndex}`}
                    className="w-6 h-6 bg-transparent"
                  />
                );
              }
              
              // Calculate seat number
              const seatNumber = getSeatNumber(rowIndex, seatIndex);
              const seatColor = getSeatColor(rowIndex, seatIndex);
              const seatId = `${section.id}-${rowIndex}-${seatIndex}`;
              const schoolName = seatAssignments[seatId];
              
              return (
                <div
                  key={`seat-${seatIndex}`}
                  className={`relative group w-6 h-6 border rounded flex items-center justify-center transition-colors ${
                    seatColor 
                      ? 'border-gray-400 cursor-pointer' 
                      : 'bg-white border-gray-300 hover:bg-gray-100'
                  }`}
                  style={seatColor ? { backgroundColor: seatColor } : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPreviewMode && onSeatClick) {
                      onSeatClick(rowIndex, seatIndex);
                    }
                  }}
                >
                  <span className={`text-sm flex items-center justify-center w-full h-full leading-none ${seatColor ? 'text-white font-medium' : 'text-gray-700'}`}>
                    {seatNumber}
                  </span>
                  
                  {/* Remove seat button (only in edit mode and when section is selected) */}
                  {!isPreviewMode && isSelected && onSeatRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeatRemove(rowIndex, seatIndex);
                      }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2 h-2 text-white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Row label (right side) */}
          <div className="w-8 text-center text-xs font-medium text-gray-700 ml-2">
            <div className="flex items-center justify-center h-full">{rowLabel}</div>
          </div>
        </div>
      );
    });
  };

  // Render vertical seats with proper alignment and numbering direction
  const renderVerticalSeats = () => {
    const maxSeats = Math.max(...(section.rowSeats || []));

    // Create arrays for visible rows and columns
    const visibleRows = Array.from({ length: section.rows })
      .map((_, i) => i)
      .filter(rowIndex => !(section.emptyRows instanceof Set && section.emptyRows.has(rowIndex)));

    // Get alignment for the entire section
    const sectionAlignment = section.alignment;

    return (
      <div className={`flex ${
        sectionAlignment === 'left' ? 'justify-start' : 
        sectionAlignment === 'right' ? 'justify-end' : 
        'justify-center'
      }`}>
        <div className="flex flex-row">
          {/* Seat numbers (left column) */}
          <div className="flex flex-col mr-2 items-center">
            <div className="h-8"></div> {/* Empty space for alignment */}
            {Array.from({ length: maxSeats }).map((_, seatIndex) => {
              // Apply RTL if needed
              const displayIndex = numberingDirection === 'rtl' || section.numberingDirection === 'rtl'
                ? maxSeats - seatIndex - 1 
                : seatIndex;
              
              return (
                <div key={seatIndex} className="w-6 h-6 flex items-center justify-center my-0.5">
                  <span className="text-xs font-medium text-gray-700">{displayIndex + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Rows with seats */}
          {visibleRows.map(rowIndex => {
            const rowLabel = getRowLabel(rowIndex, section.numberingStyle);
            const seatsInRow = section.rowSeats[rowIndex] || 0;
            
            return (
              <div key={rowIndex} className="flex flex-col mx-1">
                {/* Row label (top) */}
                <div className="h-8 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">{rowLabel}</span>
                </div>
                
                {/* Seats in this row */}
                <div className="flex flex-col">
                  {Array.from({ length: maxSeats }).map((_, seatIndex) => {
                    // Skip if this seat is outside the row's range
                    if (seatIndex >= seatsInRow) {
                      return <div key={`empty-${seatIndex}`} className="w-6 h-6 my-0.5"></div>;
                    }
                    
                    // Skip removed seats
                    if (isSeatRemoved(rowIndex, seatIndex)) {
                      return <div key={`removed-${seatIndex}`} className="w-6 h-6 my-0.5"></div>;
                    }
                    
                    // Render gap
                    if (shouldRenderGap(rowIndex, seatIndex)) {
                      return (
                        <div
                          key={`gap-${seatIndex}`}
                          className="w-6 h-6 bg-transparent my-0.5"
                        />
                      );
                    }
                    
                    // Apply RTL if needed
                    const displayIndex = numberingDirection === 'rtl' || section.numberingDirection === 'rtl'
                      ? maxSeats - seatIndex - 1 
                      : seatIndex;
                    
                    // Calculate seat number
                    const seatNumber = getSeatNumber(rowIndex, displayIndex);
                    const seatColor = getSeatColor(rowIndex, displayIndex);
                    const seatId = `${section.id}-${rowIndex}-${displayIndex}`;
                    const schoolName = seatAssignments[seatId];
                    
                    return (
                      <div 
                        key={`seat-${seatIndex}`}
                        className={`relative border rounded flex items-center justify-center hover:bg-gray-100 transition-colors my-0.5 ${
                          seatColor 
                            ? 'border-gray-400 cursor-pointer' 
                            : 'bg-white border-gray-300'
                        }`}
                        style={{ 
                          width: `${20}px`,
                          height: `${20}px`,
                          ...(seatColor ? { backgroundColor: seatColor } : {})
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPreviewMode && onSeatClick) {
                            onSeatClick(rowIndex, displayIndex);
                          }
                        }}
                      >
                        <span className={`text-xs flex items-center justify-center w-full h-full leading-none ${seatColor ? 'text-white font-medium' : 'text-gray-700'}`}>
                          {seatNumber}
                        </span>
                        
                        {/* Remove seat button (only in edit mode and when section is selected) */}
                        {!isPreviewMode && isSelected && onSeatRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSeatRemove(rowIndex, displayIndex);
                            }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-2 h-2 text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Seat numbers (right column) */}
          <div className="flex flex-col ml-2 items-center">
            <div className="h-8"></div> {/* Empty space for alignment */}
            {Array.from({ length: maxSeats }).map((_, seatIndex) => {
              // Apply RTL if needed
              const displayIndex = numberingDirection === 'rtl' || section.numberingDirection === 'rtl'
                ? maxSeats - seatIndex - 1 
                : seatIndex;
              
              return (
                <div key={seatIndex} className="w-6 h-6 flex items-center justify-center my-0.5">
                  <span className="text-xs font-medium text-gray-700">{displayIndex + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {/* Seats rendering */}
      <div className="p-2 overflow-auto cursor-default">
        {renderSeats()}
      </div>
    </div>
  );
};

interface HallEditorGridProps {
  sections: Record<string, SectionBlock>;
  selectedSectionId: string | null;
  onSectionSelect: (id: string | null) => void;
  onSeatClick?: (sectionId: string, rowIndex: number, seatIndex: number) => void;
  onSectionUpdate?: (id: string, updates: Partial<SectionBlock>) => void;
  onSectionResize?: (id: string, width: number, height: number) => void;
  gridSize?: number; // Total grid cells (width/height)
  cellSize?: number; // Size of each cell in pixels
  autoRenumberSeats?: boolean;
  isPreviewMode?: boolean;
  seatAssignments?: Record<string, string>;
  schools?: { name: string; color: string }[]; 
  showLegend?: boolean;
  sectionColors?: Record<string, string>;
  numberingDirections?: Record<string, 'ltr' | 'rtl'>;
}

export const HallEditorGrid: React.FC<HallEditorGridProps> = ({
  sections,
  selectedSectionId,
  onSectionSelect,
  onSeatClick,
  onSectionUpdate, 
  onSectionResize,
  gridSize = 200,
  cellSize = 10,
  autoRenumberSeats = false,
  isPreviewMode = false,
  seatAssignments = {},
  schools = [],
  showLegend = false,
  sectionColors = {},
  numberingDirections = {}
}) => {
  // Calculate the number of sections to determine scaling
  const sectionCount = Object.keys(sections).length;
  
  // Calculate scale factor based on number of sections
  const calculateScale = () => {
    if (isPreviewMode) {
      // Base scale is 1
      let scale = 1;
      
      // Reduce scale based on number of sections
      if (sectionCount > 5) scale = 0.8;
      if (sectionCount > 7) scale = 0.7;
      if (sectionCount > 9) scale = 0.6;
      
      return scale;
    }
    return 1;
  };
  
  const scaleValue = calculateScale();

  return (
    <div className={isPreviewMode ? "w-full flex flex-col items-center justify-center max-w-full overflow-hidden" : ""}>
      <div 
        className={`relative bg-white border border-gray-100 rounded-lg ${isPreviewMode ? "overflow-hidden w-full flex justify-center print:block" : "overflow-auto"} min-h-[2000px] max-w-full`}
        onClick={() => onSectionSelect(null)}
        style={{
          width: isPreviewMode ? '100%' : '100%', 
          height: isPreviewMode ? 'auto' : '2000px',
          minHeight: isPreviewMode ? '600px' : '2000px',
          maxWidth: '100%',
          backgroundImage: isPreviewMode ? 'none' : `
              linear-gradient(to right, #f1f1f1 1px, transparent 1px),
              linear-gradient(to bottom, #f1f1f1 1px, transparent 1px)
             `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          position: 'relative',
          transform: 'none',
          transformOrigin: 'top center',
          overflowX: isPreviewMode ? 'visible' : 'auto'
        }}
      >
        <div className={`flex flex-col items-center ${isPreviewMode ? "min-w-max mx-auto print:block" : ""}`} style={{ transform: isPreviewMode ? `scale(${scaleValue})` : 'none' }}>
          <div className="flex flex-nowrap items-start justify-center mx-auto">
            {/* Group sections by position */}
            <div className="flex flex-row items-start">
              {/* Left sections */}
              <div className="flex flex-row">
                {Object.entries(sections)
                  .filter(([_, section]) => section.position === 'left')
                  .map(([id, section]) => (
                    <div 
                      key={id}
                      className="relative mx-1"
                    >
                      <StaticSection
                        section={{...section, id: id}}
                        isSelected={id === selectedSectionId}
                        onClick={() => onSectionSelect(id)}
                        onSeatClick={
                          onSeatClick 
                            ? (rowIndex, seatIndex) => onSeatClick(id, rowIndex, seatIndex)
                            : undefined
                        }
                        onSeatRemove={
                          (rowIndex, seatIndex) => {
                            if (!onSectionUpdate) return;
                            
                            const newRemovedSeats = { ...section.removedSeats };
                            if (!newRemovedSeats[rowIndex]) {
                              newRemovedSeats[rowIndex] = new Set();
                            }
                            newRemovedSeats[rowIndex].add(seatIndex);
                            
                            onSectionUpdate(id, { removedSeats: newRemovedSeats });
                          }
                        }
                        isPreviewMode={isPreviewMode}
                        cellSize={cellSize}
                        onSectionUpdate={(updates) => onSectionUpdate && onSectionUpdate(id, updates)}
                        seatAssignments={seatAssignments}
                        schools={schools}
                        sectionColor={sectionColors[id]}
                        numberingDirection={numberingDirections?.[id] || section.numberingDirection}
                      />
                    </div>
                  ))}
              </div>
              
              {/* Center sections */}
              <div className="flex flex-col mx-2">
                {Object.entries(sections)
                  .filter(([_, section]) => section.position === 'center')
                  .map(([id, section]) => (
                    <div 
                      key={id}
                      className="relative"
                    >
                      <StaticSection
                        section={{...section, id: id}}
                        isSelected={id === selectedSectionId}
                        onClick={() => onSectionSelect(id)}
                        onSeatClick={
                          onSeatClick 
                            ? (rowIndex, seatIndex) => onSeatClick(id, rowIndex, seatIndex)
                            : undefined
                        }
                        onSeatRemove={
                          (rowIndex, seatIndex) => {
                            if (!onSectionUpdate) return;
                            
                            const newRemovedSeats = { ...section.removedSeats };
                            if (!newRemovedSeats[rowIndex]) {
                              newRemovedSeats[rowIndex] = new Set();
                            }
                            newRemovedSeats[rowIndex].add(seatIndex);
                            
                            onSectionUpdate(id, { removedSeats: newRemovedSeats });
                          }
                        }
                        isPreviewMode={isPreviewMode}
                        cellSize={cellSize}
                        onSectionUpdate={(updates) => onSectionUpdate && onSectionUpdate(id, updates)}
                        seatAssignments={seatAssignments}
                        schools={schools}
                        sectionColor={sectionColors[id]}
                        numberingDirection={numberingDirections?.[id] || section.numberingDirection}
                      />
                    </div>
                  ))}
              </div>
              
              {/* Right sections */}
              <div className="flex flex-row">
                {Object.entries(sections)
                  .filter(([_, section]) => section.position === 'right')
                  .map(([id, section]) => (
                    <div 
                      key={id}
                      className="relative mx-1"
                    >
                      <StaticSection
                        section={{...section, id: id}}
                        isSelected={id === selectedSectionId}
                        onClick={() => onSectionSelect(id)}
                        onSeatClick={
                          onSeatClick 
                            ? (rowIndex, seatIndex) => onSeatClick(id, rowIndex, seatIndex)
                            : undefined
                        }
                        onSeatRemove={
                          (rowIndex, seatIndex) => {
                            if (!onSectionUpdate) return;
                            
                            const newRemovedSeats = { ...section.removedSeats };
                            if (!newRemovedSeats[rowIndex]) {
                              newRemovedSeats[rowIndex] = new Set();
                            }
                            newRemovedSeats[rowIndex].add(seatIndex);
                            
                            onSectionUpdate(id, { removedSeats: newRemovedSeats });
                          }
                        }
                        isPreviewMode={isPreviewMode}
                        cellSize={cellSize}
                        onSectionUpdate={(updates) => onSectionUpdate && onSectionUpdate(id, updates)}
                        seatAssignments={seatAssignments}
                        schools={schools}
                        sectionColor={sectionColors[id]}
                        numberingDirection={numberingDirections?.[id] || section.numberingDirection}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          {/* Back sections */}
          <div className="mt-8">
            {Object.entries(sections)
              .filter(([_, section]) => section.position === 'back')
              .map(([id, section]) => (
                <div 
                  key={id}
                  className="relative mb-4"
                >
                  <StaticSection
                    section={{...section, id: id}}
                    isSelected={id === selectedSectionId}
                    onClick={() => onSectionSelect(id)}
                    onSeatClick={
                      onSeatClick 
                        ? (rowIndex, seatIndex) => onSeatClick(id, rowIndex, seatIndex)
                        : undefined
                    }
                    onSeatRemove={
                      (rowIndex, seatIndex) => {
                        if (!onSectionUpdate) return;
                        
                        const newRemovedSeats = { ...section.removedSeats };
                        if (!newRemovedSeats[rowIndex]) {
                          newRemovedSeats[rowIndex] = new Set();
                        }
                        newRemovedSeats[rowIndex].add(seatIndex);
                        
                        onSectionUpdate(id, { removedSeats: newRemovedSeats });
                      }
                    }
                    isPreviewMode={isPreviewMode}
                    cellSize={cellSize}
                    onSectionUpdate={(updates) => onSectionUpdate && onSectionUpdate(id, updates)}
                    seatAssignments={seatAssignments}
                    schools={schools}
                    sectionColor={sectionColors[id]}
                    numberingDirection={numberingDirections?.[id] || section.numberingDirection}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface HallLayoutGridProps {
  sections: Record<string, SectionConfig>;
  sectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'>;
  selectedSection: string | null;
  onSectionSelect: (id: string | null) => void;
  onRemoveSeat?: (sectionId: string, rowIndex: number, seatIndex: number) => void;
  onSeatClick?: (sectionId: string, rowIndex: number, seatIndex: number) => void;
  isPreviewMode?: boolean;
  seatAssignments?: Record<string, string>;
  schools?: { name: string; color: string }[];
  showLegend?: boolean;
  sectionColors?: Record<string, string>;
  numberingDirections?: Record<string, 'ltr' | 'rtl'>;
  autoRenumberSeats: boolean;
}

export default HallEditorGrid;