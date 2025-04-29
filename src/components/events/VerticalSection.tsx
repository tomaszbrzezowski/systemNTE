import React, { useState } from 'react';
import RowComponent from './RowComponent';
import AisleComponent from './AisleComponent';
import { getRowLabel, isEmptyRow } from '../../utils/hallLayoutUtils';
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
  rowSeatsPerRow: Record<string, Record<number, number>>;
  rowAlignments: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  sectionAlignments: Record<string, 'left' | 'center' | 'right'>;
  skipRemovedSeatsVisual: boolean;
  side: 'left' | 'right';
  onAddEmptyRow?: (section: string, afterRowIndex: number) => void;
  onRemoveSeat?: (section: string, rowIndex: number, seatIndex: number) => void;
  onSelectRow?: (section: string, rowIndex: number) => void;
}

/**
 * Component that represents a vertical section in a hall layout
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
  rowSeatsPerRow,
  rowAlignments,
  sectionAlignments,
  skipRemovedSeatsVisual,
  side,
  onAddEmptyRow,
  onRemoveSeat,
  onSelectRow
}) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  
  return (
    <div className={`flex-shrink-0 min-w-[300px] mx-2 ${side === 'left' ? 'order-first' : 'order-last'}`}>
      <h3 className="text-sm font-medium mb-3 text-center">
        {sectionName}
      </h3>
      <div className="space-y-2 mx-auto overflow-x-auto">
        {Array.from({ length: config.rows * 2 }).map((_, index) => {
          // Check if this is a row or an aisle
          const isAisle = index % 2 === 1;
          const rowIndex = Math.floor(index / 2);
          const aisleIndex = rowIndex + 0.5;
          
          // If this is an aisle, check if it should be rendered
          if (isAisle) {
            // Only render if this aisle is marked as empty
            if (!isEmptyRow(section, aisleIndex, emptyRows)) {
              return null;
            }
            
            // Render aisle
            return (
              <AisleComponent
                key={`aisle-${rowIndex}`}
                section={section}
                rowIndex={rowIndex}
                onRemoveAisle={onAddEmptyRow}
              />
            );
          } else {
            // Skip if this row is marked as empty
            if (isEmptyRow(section, rowIndex, emptyRows)) {
              return null;
            }

            // Get row label
            const rowLabelText = rowLabels[section]?.[rowIndex] || 
              getRowLabel(rowIndex, section, sectionNumberingStyle);

            // Get the number of seats for this row (custom or default)
            const rowSeats = rowSeatsPerRow[section]?.[rowIndex] !== undefined
              ? rowSeatsPerRow[section][rowIndex]
              : config.seatsPerRow;
            
            // Render normal row
            return (
              <RowComponent
                key={`row-${rowIndex}`}
                section={section}
                rowIndex={rowIndex}
                rowLabel={rowLabelText}
                rowSeats={rowSeats}
                sections={{ [section]: config }}
                removedSeats={removedSeats}
                rowAlignments={rowAlignments}
                sectionAlignments={sectionAlignments}
                numberingDirection={numberingDirection}
                skipRemovedSeatsVisual={skipRemovedSeatsVisual}
                isHovered={hoveredRow === rowIndex}
                onMouseEnter={() => setHoveredRow(rowIndex)}
                onMouseLeave={() => setHoveredRow(null)}
                onAddEmptyRow={onAddEmptyRow}
                onRemoveSeat={onRemoveSeat}
                onClick={onSelectRow ? () => onSelectRow(section, rowIndex) : undefined}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default VerticalSection; 