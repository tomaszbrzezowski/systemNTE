import { toRoman } from './stringUtils';

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