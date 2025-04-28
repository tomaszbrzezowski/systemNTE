import React from 'react';
import HallLayoutGrid from './HallLayoutGrid';

interface HallLayoutContentProps {
  sections: Record<string, any>;
  sectionNames: Record<string, string>;
  numberingDirections?: Record<string, 'ltr' | 'rtl'>;
  rowLabels: Record<string, Record<number, string>>;
  removedSeats: Record<string, Record<number, Set<number>>>;
  emptyRows: Record<string, Set<number>>;
  sectionAlignments?: Record<string, 'left' | 'center' | 'right'>;
  rowAlignments?: Record<string, Record<number, 'left' | 'center' | 'right'>>;
}

const HallLayoutContent: React.FC<HallLayoutContentProps> = ({
  sections,
  sectionNames,
  numberingDirections = {},
  rowLabels,
  removedSeats,
  emptyRows,
  sectionAlignments = {},
  rowAlignments = {}
}) => {
  const requiredSectionKeys = [
    'main',
    'left', 'left1', 'left2',
    'right', 'right1', 'right2',
    'back', 'back1', 'back2'
  ];

  const sanitizedSections = Object.fromEntries(
    requiredSectionKeys.map((key) => {
      const val = sections?.[key] ?? {};
      return [
        key,
        {
          ...val,
          width: val?.width ?? 0,
          height: val?.height ?? 0,
          rows: val?.rows ?? 0,
          rowSeats: val?.rowSeats ?? [],
          removedSeats: val?.removedSeats ?? {},
          emptyRows: val?.emptyRows ?? new Set(),
          seatGaps: val?.seatGaps ?? {},
        }
      ];
    })
  );

  const sanitizedSectionNames = Object.fromEntries(
    requiredSectionKeys.map((key) => [key, sectionNames?.[key] ?? key.toUpperCase()])
  );

  const sanitizedNumberingDirections = Object.fromEntries(
    requiredSectionKeys.map((key) => [key, numberingDirections?.[key] ?? 'ltr'])
  );

  const sanitizedRowLabels = Object.fromEntries(
    requiredSectionKeys.map((key) => [key, rowLabels?.[key] ?? {}])
  );

  const sanitizedSectionAlignments = Object.fromEntries(
    requiredSectionKeys.map((key) => [key, sectionAlignments?.[key] ?? 'center'])
  );

  const sanitizedRowAlignments = Object.fromEntries(
    requiredSectionKeys.map((key) => [key, rowAlignments?.[key] ?? {}])
  );

  console.log('SANITIZED SECTIONS:', sanitizedSections);

  return (
    <HallLayoutGrid
      sections={sanitizedSections}
      numberingDirections={sanitizedNumberingDirections}
      sectionNames={sanitizedSectionNames}
      selectedSection={null}
      onSelectSection={() => {}}
      rowLabels={sanitizedRowLabels}
      removedSeats={removedSeats}
      emptyRows={emptyRows}
      onSectionNameChange={() => {}}
      onRemoveSeat={() => {}}
      onAddEmptyRow={() => {}}
      sectionAlignments={sanitizedSectionAlignments}
      rowAlignments={sanitizedRowAlignments}
    />
  );
};

export default HallLayoutContent;