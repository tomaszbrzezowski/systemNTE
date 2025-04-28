import React from 'react';
import SeatComponent from './SeatComponent';
import { getRowLabel, isEmptyRow, getRowAlignment, isSeatRemoved, getSeatNumber } from '../../utils/hallLayoutUtils';
import { SectionConfig } from '../../utils/hallLayoutUtils';

interface VerticalSectionProps {
  section: string;
  config: SectionConfig;
  sectionName: string;
  sectionNumberingStyle: 'arabic' | 'roman' | 'letters';
  numberingDirection: 'ltr' | 'rtl';
  rowLabels: Record<string, Record<number, string>>;
  emptyRows: Record<string, Set<number>>;
  removedSeats: Record<string, Record<number, Set<number>>>;
  rowAlignments: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  sectionAlignments: Record<string, 'left' | 'center' | 'right'>;
  skipRemovedSeatsVisual: boolean;
  onRemoveSeat?: (section: string, rowIndex: number, seatIndex: number) => void;
}

/**
 * Component that represents a vertical (side) section in the hall layout
 */
const VerticalSection: React.FC<VerticalSectionProps> = ({
  section,
  config,
  sectionName,
  sectionNumberingStyle,
  numberingDirection,
  rowLabels,
  emptyRows,
  removedSeats,
  rowAlignments,
  sectionAlignments,
  skipRemovedSeatsVisual,
  onRemoveSeat
}) => {
  return (
    <div className="flex flex-col items-center mb-8">
      <h3 className="text-sm font-medium mb-3 cursor-pointer">
        {sectionName}
      </h3>
      <div className="flex">
        {/* Seats grid */}
        <div className="flex">
          {Array.from({ length: config.rows }).map((_, rowIndex) => (
            // Skip rendering row label and seats if this is an empty row
            isEmptyRow(section, rowIndex, emptyRows) ? (
              <div key={rowIndex} className="flex flex-col items-center mx-1">
                <div className="h-6 flex items-center justify-center">
                  <span className="text-xs text-gray-400">—</span>
                </div>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: config.seatsPerRow }).map((_, seatIndex) => (
                    <div key={seatIndex} className="w-6 h-6" />
                  ))}
                </div>
              </div>
            ) : (
              <div key={rowIndex} className="flex flex-col items-center mx-1">
                <div className="h-6 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">
                    {rowLabels[section]?.[rowIndex] || getRowLabel(rowIndex, section, sectionNumberingStyle)}
                  </span>
                </div>
                <div className={`flex flex-col gap-1 ${
                  getRowAlignment(section, rowIndex, rowAlignments, sectionAlignments) === 'left' ? 'items-start' :
                  getRowAlignment(section, rowIndex, rowAlignments, sectionAlignments) === 'right' ? 'items-end' :
                  'items-center'
                }`}>
                  {Array.from({ length: config.seatsPerRow }).map((_, seatIndex) => {
                    // Check if this seat is removed
                    const isRemoved = isSeatRemoved(section, rowIndex, seatIndex, removedSeats);
                    
                    // Calculate seat number based on whether auto-renumbering is enabled
                    const seatNumber = getSeatNumber(
                      section, 
                      rowIndex, 
                      seatIndex, 
                      { [section]: config }, 
                      removedSeats, 
                      skipRemovedSeatsVisual, 
                      numberingDirection
                    );
                    
                    return (
                      <SeatComponent
                        key={`seat-${seatIndex}`}
                        seatNumber={seatNumber}
                        isRemoved={isRemoved}
                        onRemoveSeat={onRemoveSeat ? () => onRemoveSeat(section, rowIndex, seatIndex) : undefined}
                        onRestoreSeat={onRemoveSeat ? () => onRemoveSeat(section, rowIndex, seatIndex) : undefined}
                      />
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

export default VerticalSection; 