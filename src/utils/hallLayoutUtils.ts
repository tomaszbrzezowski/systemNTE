import { toRoman } from './romanNumerals';

export interface SectionConfig {
  enabled: boolean;
  rows: number;
  seatsPerRow: number;
}

export interface HallLayoutState {
  sections: Record<string, SectionConfig>;
  sectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'>;
  rowLabels: Record<string, Record<number, string>>;
  emptyRows: Record<string, Set<number>>;
  removedSeats: Record<string, Record<number, Set<number>>>;
  rowSeatsPerRow: Record<string, Record<number, number>>;
  numberingDirections: Record<string, 'ltr' | 'rtl'>;
  sectionNames: Record<string, string>;
  rowAlignments: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  sectionAlignments: Record<string, 'left' | 'center' | 'right'>;
}

export const ALL_SECTIONS = [
  'main', 'left', 'right', 'back', 'back1', 'back2', 'left1', 'left2', 'right1', 'right2'
] as const;

export type SectionType = typeof ALL_SECTIONS[number];

export const getRowLabel = (rowIndex: number, section: string, style: 'arabic' | 'roman' | 'letters' = 'arabic'): string => {
  switch (style) {
    case 'roman':
      return toRoman(rowIndex + 1);
    case 'letters':
      return String.fromCharCode(65 + rowIndex); // A = 65 in ASCII
    case 'arabic':
    default:
      return (rowIndex + 1).toString();
  }
};

export const mergeWithDefaultSectionNames = (incoming: Record<string, string> = {}): Record<string, string> => {
  const defaultNames: Record<string, string> = {
    main: 'PARTER',
    left: 'BALKON LEWY I',
    left1: 'BALKON LEWY II',
    left2: 'BALKON LEWY III',
    right: 'BALKON PRAWY I',
    right1: 'BALKON PRAWY II',
    right2: 'BALKON PRAWY III',
    back: 'BALKON I',
    back1: 'BALKON II',
    back2: 'BALKON III',
  };

  return {
    ...defaultNames,
    ...incoming,
  };
};

export const calculateTotalSeats = (
  sections: Record<string, SectionConfig>,
  emptyRows: Record<string, Set<number>>,
  removedSeats: Record<string, Record<number, Set<number>>>
): number => {
  let total = 0;
  
  Object.entries(sections)
    .filter(([_, config]) => config.enabled)
    .forEach(([section, config]) => {
      for (let rowIndex = 0; rowIndex < config.rows; rowIndex++) {
        if (emptyRows[section]?.has(rowIndex)) continue;
        
        const seatsInRow = removedSeats[section]?.[rowIndex]?.size ?? 0;
        total += config.seatsPerRow - seatsInRow;
      }
    });
    
  return total;
};

/**
 * Checks if a seat is removed
 * @param section Section identifier
 * @param rowIndex Row index
 * @param seatIndex Seat index
 * @param removedSeats Object containing removed seats information
 * @returns True if the seat is removed, false otherwise
 */
export const isSeatRemoved = (
  section: string, 
  rowIndex: number, 
  seatIndex: number, 
  removedSeats: Record<string, Record<number, Set<number>>>
): boolean => {
  if (!removedSeats[section]) return false;
  if (!removedSeats[section][rowIndex]) return false;
  const seatSet = removedSeats[section][rowIndex];
  return seatSet instanceof Set && seatSet.has(seatIndex);
};

/**
 * Calculates seat number within a row with proper numbering direction
 * @param section Section identifier
 * @param rowIndex Row index
 * @param seatIndex Seat index
 * @param sections Sections configuration
 * @param removedSeats Removed seats information
 * @param skipRemovedSeatsVisual Whether to skip removed seats in numbering
 * @param direction Numbering direction (left-to-right or right-to-left)
 * @returns The seat number or 0 if the seat is removed
 */
export const getSeatNumber = (
  section: string, 
  rowIndex: number, 
  seatIndex: number, 
  sections: Record<string, SectionConfig>,
  removedSeats: Record<string, Record<number, Set<number>>>,
  skipRemovedSeatsVisual: boolean = false,
  direction: 'ltr' | 'rtl' = 'ltr'
): number => {
  // Check if the section exists
  if (!sections[section]) {
    return 0;
  }

  // If skip removed seats visual is disabled, we just need to handle directions
  if (!skipRemovedSeatsVisual) {
    if (direction === 'rtl') {
      const total = sections[section].seatsPerRow;
      return total - seatIndex;
    }
    return seatIndex + 1;
  }

  // If the seat is removed, return 0
  if (isSeatRemoved(section, rowIndex, seatIndex, removedSeats)) {
    return 0;
  }

  // For RTL numbering direction
  if (direction === 'rtl') {
    let visibleSeatsCount = 0;
    for (let i = 0; i < sections[section].seatsPerRow; i++) {
      if (!isSeatRemoved(section, rowIndex, i, removedSeats)) {
        visibleSeatsCount++;
      }
    }

    let visibleSeatsAfter = 0;
    for (let i = 0; i < seatIndex; i++) {
      if (!isSeatRemoved(section, rowIndex, i, removedSeats)) {
        visibleSeatsAfter++;
      }
    }

    return visibleSeatsCount - visibleSeatsAfter;
  }

  // For LTR numbering direction (default)
  let seatNumber = 1;
  for (let i = 0; i < seatIndex; i++) {
    if (!isSeatRemoved(section, rowIndex, i, removedSeats)) {
      seatNumber++;
    }
  }

  return seatNumber;
};

/**
 * Checks if a row is empty (aisle)
 * @param section Section identifier
 * @param rowIndex Row index
 * @param emptyRows Object containing empty rows information
 * @returns True if the row is empty (aisle), false otherwise
 */
export const isEmptyRow = (
  section: string, 
  rowIndex: number, 
  emptyRows: Record<string, Set<number>>
): boolean => {
  // Check if emptyRows[section] exists and is a Set
  const sectionEmptyRows = emptyRows[section];
  if (!(sectionEmptyRows instanceof Set)) {
    return false;
  }
  
  // Check if this exact row index is marked as empty
  return sectionEmptyRows.has(rowIndex) || sectionEmptyRows.has(Math.floor(rowIndex)) || false;
};

/**
 * Gets the row alignment based on row-specific or section-wide settings
 * @param section Section identifier
 * @param rowIndex Row index
 * @param rowAlignments Row-specific alignments
 * @param sectionAlignments Section-wide alignments
 * @returns The alignment to use ('left', 'center', or 'right')
 */
export const getRowAlignment = (
  section: string,
  rowIndex: number,
  rowAlignments: Record<string, Record<number, 'left' | 'center' | 'right'>>,
  sectionAlignments: Record<string, 'left' | 'center' | 'right'>
): 'left' | 'center' | 'right' => {
  // Check for row-specific alignment
  if (rowAlignments[section]?.[rowIndex]) {
    return rowAlignments[section][rowIndex];
  }
  
  // Fall back to section-wide alignment
  return sectionAlignments[section] || 'center';
};

/**
 * Gets the section alignment
 * @param section Section identifier
 * @param sectionAlignments Section alignments
 * @returns The section alignment ('left', 'center', or 'right')
 */
export const getSectionAlignment = (
  section: string,
  sectionAlignments: Record<string, 'left' | 'center' | 'right'>
): 'left' | 'center' | 'right' => {
  return sectionAlignments[section] || 'center';
}; 