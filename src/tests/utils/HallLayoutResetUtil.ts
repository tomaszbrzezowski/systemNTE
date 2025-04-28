import { toast } from 'react-hot-toast';

export function resetLayout({
  setSections,
  setSectionNames,
  setSectionNumberingStyles,
  setNumberingDirections,
  setRowLabels,
  setRemovedSeats,
  setEmptyRows,
  setRowSeatsPerRow,
  setRowAlignments,
  setSectionAlignments
}: {
  setSections: React.Dispatch<any>,
  setSectionNames: React.Dispatch<any>,
  setSectionNumberingStyles: React.Dispatch<any>,
  setNumberingDirections: React.Dispatch<any>,
  setRowLabels: React.Dispatch<any>,
  setRemovedSeats: React.Dispatch<any>,
  setEmptyRows: React.Dispatch<any>,
  setRowSeatsPerRow: React.Dispatch<any>,
  setRowAlignments: React.Dispatch<any>,
  setSectionAlignments: React.Dispatch<any>
}) {
  if (!window.confirm('Czy na pewno chcesz zresetować plan sali? Ta operacja jest nieodwracalna.')) return;

  setSections({
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
  });

  setSectionNames({
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
  });

  setSectionNumberingStyles({
    main: 'arabic', left: 'arabic', right: 'arabic', back: 'arabic',
    back1: 'arabic', back2: 'arabic', left1: 'arabic', left2: 'arabic',
    right1: 'arabic', right2: 'arabic'
  });

  setNumberingDirections({
    main: 'ltr', left: 'ltr', right: 'ltr', back: 'ltr',
    back1: 'ltr', back2: 'ltr', left1: 'ltr', left2: 'ltr',
    right1: 'ltr', right2: 'ltr'
  });

  setRowLabels({
    main: {}, left: {}, right: {}, back: {}, back1: {}, back2: {},
    left1: {}, left2: {}, right1: {}, right2: {}
  });

  setRemovedSeats({
    main: {}, left: {}, right: {}, back: {}, back1: {}, back2: {},
    left1: {}, left2: {}, right1: {}, right2: {}
  });

  setEmptyRows({
    main: new Set(), left: new Set(), right: new Set(), back: new Set(),
    back1: new Set(), back2: new Set(), left1: new Set(), left2: new Set(),
    right1: new Set(), right2: new Set()
  });

  setRowSeatsPerRow({
    main: {}, left: {}, right: {}, back: {}, back1: {}, back2: {},
    left1: {}, left2: {}, right1: {}, right2: {}
  });

  setRowAlignments({
    main: {}, left: {}, right: {}, back: {}, back1: {}, back2: {},
    left1: {}, left2: {}, right1: {}, right2: {}
  });

  setSectionAlignments({
    main: 'center', left: 'center', right: 'center', back: 'center',
    back1: 'center', back2: 'center', left1: 'center', left2: 'center',
    right1: 'center', right2: 'center'
  });

  toast.success('Plan sali został zresetowany do domyślnych ustawień.');
} 
