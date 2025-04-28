import React from 'react';
import MainSection from './MainSection';
import VerticalSection from './VerticalSection';
import BackSection from './BackSection';
import { SectionConfig } from '../../utils/hallLayoutUtils';

interface HallLayoutGridProps {
  sections: Record<string, SectionConfig>;
  sectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'>;
  numberingDirections?: Record<string, 'ltr' | 'rtl'>;
  rowLabels?: Record<string, Record<number, string>>;
  sectionNames: Record<string, string>;
  onRemoveSeat?: (section: string, rowIndex: number, seatIndex: number) => void;
  rowSeatsPerRow?: Record<string, Record<number, number>>;
  removedSeats?: Record<string, Record<number, Set<number>>>;
  emptyRows?: Record<string, Set<number>>;
  onAddEmptyRow?: (section: string, afterRowIndex: number) => void;
  sectionAlignments?: Record<string, 'left' | 'center' | 'right'>;
  rowAlignments?: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  skipRemovedSeatsVisual?: boolean;
  onSelectRow?: (section: string, rowIndex: number) => void;
}

/**
 * Grid component for hall layout display
 */
const HallLayoutGrid: React.FC<HallLayoutGridProps> = ({
  sections = {},
  sectionNumberingStyles = {},
  numberingDirections = {},
  rowLabels = {},
  sectionNames,
  onRemoveSeat,
  rowSeatsPerRow = {},
  removedSeats = {},
  emptyRows = {},
  onAddEmptyRow,
  sectionAlignments = {},
  rowAlignments = {},
  skipRemovedSeatsVisual = false,
  onSelectRow
}) => {
  // If sections is undefined or empty, return null
  if (!sections || Object.keys(sections).length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full overflow-x-auto max-w-full">
      {/* Scene */}
      <div className="bg-gray-100 text-gray-800 w-full max-w-4xl py-2 text-sm font-medium rounded border-b-4 border-gray-300 mx-auto mb-5 px-5">
        <div className="flex items-center justify-center">
          S     C     E     N     A
        </div>
      </div>
      
      {/* Main layout area */}
      <div className="flex w-full justify-center mb-8 max-w-full scale-100 transform-gpu origin-top overflow-x-auto">
        <div className="flex flex-nowrap items-start justify-center min-w-max">
          {/* Left sections */}
          <div className="flex-shrink-0 flex flex-row gap-2 justify-end">
            {sections.left2?.enabled && (
              <VerticalSection
                section="left2"
                config={sections.left2}
                sectionName={sectionNames.left2}
                sectionNumberingStyle={sectionNumberingStyles.left2 || 'arabic'}
                numberingDirection={numberingDirections.left2 || 'ltr'}
                rowLabels={rowLabels}
                emptyRows={emptyRows}
                removedSeats={removedSeats}
                rowAlignments={rowAlignments}
                sectionAlignments={sectionAlignments}
                skipRemovedSeatsVisual={skipRemovedSeatsVisual}
                onRemoveSeat={onRemoveSeat}
              />
            )}
            {sections.left1?.enabled && (
              <VerticalSection
                section="left1"
                config={sections.left1}
                sectionName={sectionNames.left1}
                sectionNumberingStyle={sectionNumberingStyles.left1 || 'arabic'}
                numberingDirection={numberingDirections.left1 || 'ltr'}
                rowLabels={rowLabels}
                emptyRows={emptyRows}
                removedSeats={removedSeats}
                rowAlignments={rowAlignments}
                sectionAlignments={sectionAlignments}
                skipRemovedSeatsVisual={skipRemovedSeatsVisual}
                onRemoveSeat={onRemoveSeat}
              />
            )}
            {sections.left?.enabled && (
              <VerticalSection
                section="left"
                config={sections.left}
                sectionName={sectionNames.left}
                sectionNumberingStyle={sectionNumberingStyles.left || 'arabic'}
                numberingDirection={numberingDirections.left || 'ltr'}
                rowLabels={rowLabels}
                emptyRows={emptyRows}
                removedSeats={removedSeats}
                rowAlignments={rowAlignments}
                sectionAlignments={sectionAlignments}
                skipRemovedSeatsVisual={skipRemovedSeatsVisual}
                onRemoveSeat={onRemoveSeat}
              />
            )}
          </div>
          
          {/* Center section (PARTER) */}
          {sections.main?.enabled && (
            <MainSection
              section="main"
              config={sections.main}
              sectionName={sectionNames.main}
              sectionNumberingStyle={sectionNumberingStyles.main || 'arabic'}
              numberingDirection={numberingDirections.main || 'ltr'}
              rowLabels={rowLabels}
              emptyRows={emptyRows}
              removedSeats={removedSeats}
              rowSeatsPerRow={rowSeatsPerRow}
              rowAlignments={rowAlignments}
              sectionAlignments={sectionAlignments}
              skipRemovedSeatsVisual={skipRemovedSeatsVisual}
              onAddEmptyRow={onAddEmptyRow}
              onRemoveSeat={onRemoveSeat}
            />
          )}
          
          {/* Right sections */}
          <div className="flex-shrink-0 flex flex-row gap-2 justify-start">
            {sections.right?.enabled && (
              <VerticalSection
                section="right"
                config={sections.right}
                sectionName={sectionNames.right}
                sectionNumberingStyle={sectionNumberingStyles.right || 'arabic'}
                numberingDirection={numberingDirections.right || 'ltr'}
                rowLabels={rowLabels}
                emptyRows={emptyRows}
                removedSeats={removedSeats}
                rowAlignments={rowAlignments}
                sectionAlignments={sectionAlignments}
                skipRemovedSeatsVisual={skipRemovedSeatsVisual}
                onRemoveSeat={onRemoveSeat}
              />
            )}
            {sections.right1?.enabled && (
              <VerticalSection
                section="right1"
                config={sections.right1}
                sectionName={sectionNames.right1}
                sectionNumberingStyle={sectionNumberingStyles.right1 || 'arabic'}
                numberingDirection={numberingDirections.right1 || 'ltr'}
                rowLabels={rowLabels}
                emptyRows={emptyRows}
                removedSeats={removedSeats}
                rowAlignments={rowAlignments}
                sectionAlignments={sectionAlignments}
                skipRemovedSeatsVisual={skipRemovedSeatsVisual}
                onRemoveSeat={onRemoveSeat}
              />
            )}
            {sections.right2?.enabled && (
              <VerticalSection
                section="right2"
                config={sections.right2}
                sectionName={sectionNames.right2}
                sectionNumberingStyle={sectionNumberingStyles.right2 || 'arabic'}
                numberingDirection={numberingDirections.right2 || 'ltr'}
                rowLabels={rowLabels}
                emptyRows={emptyRows}
                removedSeats={removedSeats}
                rowAlignments={rowAlignments}
                sectionAlignments={sectionAlignments}
                skipRemovedSeatsVisual={skipRemovedSeatsVisual}
                onRemoveSeat={onRemoveSeat}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Add spacing between PARTER and BALKON */}
      {(sections.back?.enabled || sections.back1?.enabled || sections.back2?.enabled) && 
        <div className="h-8 border-t border-gray-200 w-full max-w-4xl mx-auto mt-4"></div>}
      
      {/* Back sections (BALKONY) */}
      {sections.back?.enabled && (
        <BackSection
          section="back"
          config={sections.back}
          sectionName={sectionNames.back}
          sectionNumberingStyle={sectionNumberingStyles.back || 'arabic'}
          numberingDirection={numberingDirections.back || 'ltr'}
          rowLabels={rowLabels}
          emptyRows={emptyRows}
          removedSeats={removedSeats}
          rowSeatsPerRow={rowSeatsPerRow}
          rowAlignments={rowAlignments}
          sectionAlignments={sectionAlignments}
          skipRemovedSeatsVisual={skipRemovedSeatsVisual}
          onAddEmptyRow={onAddEmptyRow}
          onRemoveSeat={onRemoveSeat}
        />
      )}
      {sections.back1?.enabled && (
        <BackSection
          section="back1"
          config={sections.back1}
          sectionName={sectionNames.back1}
          sectionNumberingStyle={sectionNumberingStyles.back1 || 'arabic'}
          numberingDirection={numberingDirections.back1 || 'ltr'}
          rowLabels={rowLabels}
          emptyRows={emptyRows}
          removedSeats={removedSeats}
          rowSeatsPerRow={rowSeatsPerRow}
          rowAlignments={rowAlignments}
          sectionAlignments={sectionAlignments}
          skipRemovedSeatsVisual={skipRemovedSeatsVisual}
          onAddEmptyRow={onAddEmptyRow}
          onRemoveSeat={onRemoveSeat}
        />
      )}
      {sections.back2?.enabled && (
        <BackSection
          section="back2"
          config={sections.back2}
          sectionName={sectionNames.back2}
          sectionNumberingStyle={sectionNumberingStyles.back2 || 'arabic'}
          numberingDirection={numberingDirections.back2 || 'ltr'}
          rowLabels={rowLabels}
          emptyRows={emptyRows}
          removedSeats={removedSeats}
          rowSeatsPerRow={rowSeatsPerRow}
          rowAlignments={rowAlignments}
          sectionAlignments={sectionAlignments}
          skipRemovedSeatsVisual={skipRemovedSeatsVisual}
          onAddEmptyRow={onAddEmptyRow}
          onRemoveSeat={onRemoveSeat}
        />
      )}
    </div>
  );
};

export default HallLayoutGrid;