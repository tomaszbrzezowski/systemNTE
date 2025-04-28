export interface SeatBlock {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
  rows?: number;
  seatsPerRow?: number;
  rowSeatsPerRow?: { [key: number]: number }; // Store seats per row individually
  seatDirection?: 'ltr' | 'rtl';
  rowLabelStyle?: 'arabic' | 'roman' | 'letters';
  removedSeats?: { [key: number]: number[] }; // Store removed seats by row
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  sequentialNumbering?: boolean; // Flag to indicate sequential numbering
}