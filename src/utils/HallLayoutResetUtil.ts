interface SectionConfig {
  enabled: boolean;
  rows: number;
  seatsPerRow: number;
}

interface DefaultLayoutState {
  sections: Record<string, SectionConfig>;
  sectionNames: Record<string, string>;
  sectionNumberingStyles: Record<string, 'arabic' | 'roman' | 'letters'>;
  numberingDirections: Record<string, 'ltr' | 'rtl'>;
  rowLabels: Record<string, Record<number, string>>;
  removedSeats: Record<string, Record<number, Set<number>>>;
  emptyRows: Record<string, Set<number>>;
  rowSeatsPerRow: Record<string, Record<number, number>>;
  rowAlignments: Record<string, Record<number, 'left' | 'center' | 'right'>>;
  sectionAlignments: Record<string, 'left' | 'center' | 'right'>;
}

export const getDefaultLayoutState = (): DefaultLayoutState => {
  return {
    sections: {
      main: { enabled: true, rows: 10, seatsPerRow: 10 },
      left: { enabled: false, rows: 3, seatsPerRow: 3 },
      right: { enabled: false, rows: 3, seatsPerRow: 3 },
      back: { enabled: false, rows: 3, seatsPerRow: 10 },
      back1: { enabled: false, rows: 3, seatsPerRow: 10 },
      back2: { enabled: false, rows: 3, seatsPerRow: 10 },
      left1: { enabled: false, rows: 3, seatsPerRow: 3 },
      left2: { enabled: false, rows: 3, seatsPerRow: 3 },
      right1: { enabled: false, rows: 3, seatsPerRow: 3 },
      right2: { enabled: false, rows: 3, seatsPerRow: 3 }
    },
    sectionNames: {
      main: 'PARTER',
      left: 'BALKON LEWY I',
      left1: 'BALKON LEWY II',
      left2: 'BALKON LEWY III',
      right: 'BALKON PRAWY I',
      right1: 'BALKON PRAWY II',
      right2: 'BALKON PRAWY III',
      back: 'BALKON I',
      back1: 'BALKON II',
      back2: 'BALKON III'
    },
    sectionNumberingStyles: {
      main: 'arabic',
      left: 'arabic',
      right: 'arabic',
      back: 'arabic',
      back1: 'arabic',
      back2: 'arabic',
      left1: 'arabic',
      left2: 'arabic',
      right1: 'arabic',
      right2: 'arabic'
    },
    numberingDirections: {
      main: 'ltr',
      left: 'ltr',
      right: 'ltr',
      back: 'ltr',
      back1: 'ltr',
      back2: 'ltr',
      left1: 'ltr',
      left2: 'ltr',
      right1: 'ltr',
      right2: 'ltr'
    },
    rowLabels: {
      main: {},
      left: {},
      right: {},
      back: {},
      back1: {},
      back2: {},
      left1: {},
      left2: {},
      right1: {},
      right2: {}
    },
    removedSeats: {
      main: {},
      left: {},
      right: {},
      back: {},
      back1: {},
      back2: {},
      left1: {},
      left2: {},
      right1: {},
      right2: {}
    },
    emptyRows: {
      main: new Set<number>(),
      left: new Set<number>(),
      right: new Set<number>(),
      back: new Set<number>(),
      back1: new Set<number>(),
      back2: new Set<number>(),
      left1: new Set<number>(),
      left2: new Set<number>(),
      right1: new Set<number>(),
      right2: new Set<number>()
    },
    rowSeatsPerRow: {
      main: {},
      left: {},
      right: {},
      back: {},
      back1: {},
      back2: {},
      left1: {},
      left2: {},
      right1: {},
      right2: {}
    },
    rowAlignments: {
      main: {},
      left: {},
      right: {},
      back: {},
      back1: {},
      back2: {},
      left1: {},
      left2: {},
      right1: {},
      right2: {}
    },
    sectionAlignments: {
      main: 'center',
      left: 'center',
      right: 'center',
      back: 'center',
      back1: 'center',
      back2: 'center',
      left1: 'center',
      left2: 'center',
      right1: 'center',
      right2: 'center'
    }
  };
};