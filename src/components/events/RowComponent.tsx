import React from 'react';
import { Plus, Minus } from 'lucide-react';
import SeatComponent from './SeatComponent';
import { getRowAlignment, isSeatRemoved, getSeatNumber } from '../../utils/hallLayoutUtils';

interface RowComponentProps {
  section: string;
  rowIndex: number;
  rowLabel: string;
  rowSeats: number;
  sections: Record<string, any>;
  removedSeats: Record<string, Record<number, Set<number>>>;
  rowAlignments: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  sectionAlignments: Record<string, 'left' | 'center' | 'right'>;
  numberingDirection: 'ltr' | 'rtl';
  skipRemovedSeatsVisual: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddEmptyRow?: (section: string, afterRowIndex: number) => void;
  onRemoveSeat?: (section: string, rowIndex: number, seatIndex: number) => void;
}

/**
 * Component that represents a single row of seats in the hall layout
 */
const RowComponent: React.FC<RowComponentProps> = ({
  section,
  rowIndex,
  rowLabel,
  rowSeats,
  sections,
  removedSeats,
  rowAlignments,
  sectionAlignments,
  numberingDirection,
  skipRemovedSeatsVisual,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onAddEmptyRow,
  onRemoveSeat
}) => {
  // Get row alignment (left, center, right)
  const alignment = getRowAlignment(section, rowIndex, rowAlignments, sectionAlignments);
  
  // Convert alignment to justify class
  const justifyClass = 
    alignment === 'left' ? 'justify-start' :
    alignment === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className="flex items-center justify-center min-w-max">
      <div className="w-16 text-right pr-4 font-bold text-gray-700 relative">
        <div 
          className="flex items-center justify-end"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {isHovered && onAddEmptyRow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddEmptyRow(section, rowIndex);
              }}
              className="mr-2 p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="Dodaj przejście po tym rzędzie"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
          <span>{rowLabel}</span>
        </div>
      </div>
      
      <div className={`flex gap-1 flex-nowrap w-full ${justifyClass}`}>
        {Array.from({ length: rowSeats }).map((_, seatIndex) => {
          // Check if this seat is removed
          const isRemoved = isSeatRemoved(section, rowIndex, seatIndex, removedSeats);
          
          // Calculate seat number or set to 0 if removed
          const seatNumber = getSeatNumber(
            section, 
            rowIndex, 
            seatIndex, 
            sections, 
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
      
      <div className="w-16 text-left pl-4 font-bold text-gray-700">
        {rowLabel}
      </div>
    </div>
  );
};

export default RowComponent; 